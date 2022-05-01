import assert from "assert";
import { joinQuery } from "../src";
import { makeApp } from "./makeApp";

describe("joinQuery", function() {
  let app;
  before(async () => {
    app = (await makeApp()).app;
  });

  it("should be a function", function() {
    assert.equal(typeof joinQuery, "function");
  });

  it("should return a function", function() {
    assert.equal(typeof joinQuery(), "function");
  }
  );
  
  it("transforms flat query", function() {
    const ctx = {
      app,
      service: app.service("users"),
      type: "before",
      method: "find",
      params: {
        query: {
          "team.name": "team1"
        }
      }
    };

    joinQuery()(ctx);

    assert.deepStrictEqual(ctx.params, {
      query: {
        "$team.name$": "team1"
      },
      sequelize: {
        include: [
          {
            model: app.service("teams").Model,
            as: "team",
            attributes: []
          }
        ]
      }
    });
  });

  it("transforms query with $notation$", function() {
    const ctx = {
      app,
      service: app.service("users"),
      type: "before",
      method: "find",
      params: {
        query: {
          "$team.name$": "team1"
        }
      }
    };

    joinQuery()(ctx);

    assert.deepStrictEqual(ctx.params, {
      query: {
        "$team.name$": "team1"
      },
      sequelize: {
        include: [
          {
            model: app.service("teams").Model,
            as: "team",
            attributes: []
          }
        ]
      }
    });

    const hallo = "";
  });

  it("transforms association as object to query", function() {
    const ctx = {
      app,
      service: app.service("users"),
      type: "before",
      method: "find",
      params: {
        query: {
          team: {
            name: "team1"
          }
        }
      }
    };

    joinQuery()(ctx);

    assert.deepStrictEqual(ctx.params, {
      query: {
        "$team.name$": "team1"
      },
      sequelize: {
        include: [
          {
            model: app.service("teams").Model,
            as: "team",
            attributes: []
          }
        ]
      }
    });
  });

  it("transforms association as object to query with $or", function() {
    const ctx = {
      app,
      service: app.service("users"),
      type: "before",
      method: "find",
      params: {
        query: {
          $or: [
            { team: { name: "team1" } },
            { team: { name: "team2" } }
          ]
        }
      }
    };

    joinQuery()(ctx);

    assert.deepStrictEqual(ctx.params, {
      query: {
        "$team.name$": "team1"
      },
      sequelize: {
        include: [
          {
            model: app.service("teams").Model,
            as: "team",
            attributes: []
          }
        ]
      }
    });
  });
});