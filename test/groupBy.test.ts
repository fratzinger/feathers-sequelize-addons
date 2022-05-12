import assert from "assert";
import { $groupBy } from "../src";
import { makeApp } from "./makeApp";

describe("$groupBy", function() {
  describe("general", function() {
    it("transforms $groupBy", function() {
      const ctx = {
        params: {
          query: {
            $groupBy: "team"
          }
        }
      };

      const newCtx = $groupBy()(ctx);

      assert.deepStrictEqual(newCtx, {
        params: {
          query: {},
          sequelize: {
            group: ["team"]
          }
        }
      });

    });

    it("throws if typeof $groupBy is not string", function() {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const groupBys = [1, -1, 0, null, undefined, true, false, NaN, Infinity, {}, [], () => {}, Symbol("test")];

      for (const groupBy of groupBys) {
        const ctx = {
          params: {
            query: {
              $groupBy: groupBy
            }
          }
        };

        assert.throws(() => $groupBy()(ctx), `$groupBy must be a string, not ${typeof groupBy}`);
      }
    });
  });

  it("can groupBy", async function() {
    const { app } = await makeApp();

    const teams: any[] = await app.service("teams").create([
      { name: "team1" },
      { name: "team2" },
      { name: "team3" },
      { name: "team4" },
      { name: "team5" },
      { name: "team6" },
      { name: "team7" },
      { name: "team8" },
      { name: "team9" },
      { name: "team10" },
      { name: "team11" },
      { name: "team12" },
    ]);

    for (const team of teams) {
      await app.service("users").create([
        { name: "user", teamId: team.id },
        { name: "user", teamId: team.id },
        { name: "user", teamId: team.id },
      ]);
    }

    const users = await app.service("users").find({
      query: {
        $groupBy: "teamId"
      }
    });

    assert.deepStrictEqual(users.total, 12);
  });
});