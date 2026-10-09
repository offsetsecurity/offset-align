import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { resolve } from "node:path";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { migrate } from "../src/db/migrate.js";
import { pool, query } from "../src/db/pool.js";
import { seedControls } from "../src/db/seed.js";
import { loadPackJourney } from "../src/journey/journey.js";

/**
 * Offset Align's readiness plan, and the three checks written for it.
 *
 * CSF 2.0 asks for something the other frameworks do not: a tier chosen on two
 * dimensions, and a sentence per outcome for where you are now and where you
 * intend to be. Those are what the plan leans on, so those are what is tested
 * here against real rows.
 */
const DB = process.env["E2E_DATABASE_URL"];
const maybe = DB ? describe : describe.skip;

const ALIGN_PACK = resolve(process.cwd(), "../../packs/align");

maybe("Offset Align readiness plan", () => {
  let app: FastifyInstance;
  let sid = "";
  let csrf = "";

  const read = () => ({ cookie: `offset_sid=${sid}; offset_csrf=${csrf}` });
  const write = () => ({ ...read(), "x-csrf-token": csrf });

  interface Task { id: string; state: string; automatic: boolean; detail: string }

  const task = async (id: string): Promise<Task> => {
    const res = await app.inject({ url: "/api/v1/journey", headers: read() });
    expect(res.statusCode).toBe(200);
    const plan = res.json().journey as { stages: { tasks: Task[] }[] };
    const found = plan.stages.flatMap((s) => s.tasks).find((x) => x.id === id);
    expect(found, `no task ${id}`).toBeTruthy();
    return found!;
  };

  beforeAll(async () => {
    process.env["PACK_DIR"] = ALIGN_PACK;
    await migrate();
    for (const t of [
      "audit_log", "sessions", "users", "evidence_controls", "risk_controls", "controls",
      "programme", "risks", "evidence", "assets", "policies", "tasks", "journey_tasks", "settings",
    ]) {
      await query(`delete from ${t}`);
    }
    await seedControls();

    app = await buildApp();
    await app.ready();
    const boot = await app.inject({
      method: "POST", url: "/api/v1/auth/bootstrap",
      payload: {
        username: "admin", name: "Test Admin",
        email: "admin@example.test", password: "correct-horse-battery-staple",
      },
    });
    for (const c of boot.headers["set-cookie"] as string[]) {
      const m = /^(offset_sid|offset_csrf)=([^;]+)/.exec(c);
      if (m?.[1] === "offset_sid") sid = m[2]!;
      if (m?.[1] === "offset_csrf") csrf = m[2]!;
    }
  }, 60_000);

  afterAll(async () => {
    delete process.env["PACK_DIR"];
    await app?.close();
    await pool.end();
  });

  it("is seven stages, and names only checks that exist", async () => {
    const journey = await loadPackJourney();
    expect(journey.stages.map((s) => s.id)).toEqual(
      ["setup", "context", "tiers", "current", "target", "risk", "prove"],
    );
    const automatic = journey.stages.flatMap((s) => s.tasks).filter((t) => t.check);
    expect(automatic.length).toBeGreaterThan(14);
  });

  it("wants a tier on both dimensions, current and target", async () => {
    let t = await task("tiers.chosen");
    expect(t.automatic).toBe(true);
    expect(t.detail).toContain("governance today");

    const set = (tiers: Record<string, number>) =>
      app.inject({
        method: "PATCH", url: "/api/v1/programme", headers: write(),
        payload: { attrs: { tiers } },
      });

    await set({ govCur: 2, govTgt: 3 });
    t = await task("tiers.chosen");
    expect(t.state).toBe("outstanding");
    expect(t.detail).toContain("risk management today");
    expect(t.detail).not.toContain("governance today");

    await set({ rmCur: 2, rmTgt: 3 });
    t = await task("tiers.chosen");
    expect(t.state).toBe("done");
    expect(t.detail).toBe("current and target tiers are set");
  });

  it("counts the two profiles separately, and ignores what does not apply", async () => {
    let current = await task("current.described");
    expect(current.detail).toBe("0 of 106 subcategories describe where you are now");

    await query(
      "update controls set attrs = json_patch(attrs, $1) where ref <> 'GV.SC-10'",
      [JSON.stringify({ curState: "Done by hand, nobody owns it." })],
    );
    current = await task("current.described");
    expect(current.state).toBe("outstanding");
    expect(current.detail).toBe("105 of 106 subcategories describe where you are now");

    // Something excluded is not something to describe.
    await query("update controls set status = 'not_applicable' where ref = 'GV.SC-10'");
    current = await task("current.described");
    expect(current.state).toBe("done");
    expect(current.detail).toBe("105 of 105 subcategories describe where you are now");

    // The target profile is its own answer, and starts empty.
    const target = await task("target.described");
    expect(target.state).toBe("outstanding");
    expect(target.detail).toBe("0 of 105 subcategories say where you intend to be");

    await query(
      "update controls set attrs = json_patch(attrs, $1) where status <> 'not_applicable'",
      [JSON.stringify({ tgtState: "Documented, owned, reviewed each year." })],
    );
    expect((await task("target.described")).state).toBe("done");
  });

  it("offers the readiness plan report, now that it has a plan", async () => {
    const list = await app.inject({ url: "/api/v1/reports", headers: read() });
    const ids = list.json().reports.map((r: { id: string }) => r.id);
    expect(ids).toContain("readiness-plan");
  });
});
