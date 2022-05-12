import assert from "assert";
import { joinQuery } from "../src";
import { makeApp } from "./makeApp";

describe("joinQuery", function() {
  describe("general", function() {
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
          $or: [
            { "$team.name$": "team1" },
            { "$team.name$": "team2" }
          ]
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

    it("shares include if there are multiple", function() {
      const ctx = {
        app,
        service: app.service("todos"),
        type: "before",
        method: "find",
        params: {
          query: {
            "$user.team.name$": "team1",
            "$user.name$": "user1"
          }
        }
      };

      joinQuery()(ctx);

      assert.deepStrictEqual(ctx.params, {
        query: {
          "$user.team.name$": "team1",
          "$user.name$": "user1"
        },
        sequelize: {
          include: [
            {
              model: app.service("users").Model,
              as: "user",
              attributes: [],
              include: [
                {
                  model: app.service("teams").Model,
                  as: "team",
                  attributes: []
                }
              ]
            }
          ]
        }
      });
    });
  });

  describe("full examples", function() {
    it("can make simple nested query", async function() {
      const { app } = await makeApp();
  
      const teams = await app.service("teams").create([{
        name: "team1"
      }, {
        name: "team2"
      }, {
        name: "team3"
      }]);
  
      const users = await app.service("users").create([{
        name: "user1",
        teamId: teams[0].id
      }, {
        name: "user2",
        teamId: teams[1].id
      }, {
        name: "user3",
        teamId: teams[2].id
      }]);
  
      const usersData = await app.service("users").find({
        query: {
          "team.name": "team1"
        }
      });
  
      assert.deepStrictEqual(usersData.data, [{
        id: users[0].id,
        name: "user1",
        teamId: teams[0].id,
      }]);
    });
  
    it("can make complex query with operator", async function() {
      const { app } = await makeApp();
  
      const teams = await app.service("teams").create([{
        name: "team1"
      }, {
        name: "team2"
      }, {
        name: "team3"
      }]);
  
      const users = await app.service("users").create([{
        name: "user1",
        teamId: teams[0].id
      }, {
        name: "user2",
        teamId: teams[1].id
      }, {
        name: "user3",
        teamId: teams[2].id
      }]);
  
      const usersData = await app.service("users").find({
        query: {
          "team.name": { $in: ["team1", "team2"] }
        }
      });
  
      assert.deepStrictEqual(usersData.data, [{
        id: users[0].id,
        name: "user1",
        teamId: teams[0].id,
      }, {
        id: users[1].id,
        name: "user2",
        teamId: teams[1].id,
      }]);
    });
  
    it("can make complex query with operator", async function() {
      const { app } = await makeApp();
  
      const teams = await app.service("teams").create([{
        name: "team1",
        rating: 4
      }, {
        name: "team2",
        rating: 5
      }, {
        name: "team3",
        rating: 3
      }]);
  
      const users = await app.service("users").create([{
        name: "user1",
        teamId: teams[0].id
      }, {
        name: "user2",
        teamId: teams[1].id
      }, {
        name: "user3",
        teamId: teams[2].id
      }]);
  
      const usersData = await app.service("users").find({
        query: {
          "team.name": { $in: ["team1", "team2"] },
          "team.rating": { $gt: 4 }
        }
      });
  
      assert.deepStrictEqual(usersData.data, [{
        id: users[1].id,
        name: "user2",
        teamId: teams[1].id,
      }]);
    });
  
    it("can make nested query with operator", async function() {
      const { app } = await makeApp();
  
      const teams = await app.service("teams").create([{
        name: "team1"
      }, {
        name: "team2"
      }, {
        name: "team3"
      }]);
  
      const users = await app.service("users").create([{
        name: "user1",
        teamId: teams[0].id
      }, {
        name: "user2",
        teamId: teams[1].id
      }, {
        name: "user3",
        teamId: teams[2].id
      }]);
  
      const todos = await app.service("todos").create([{
        name: "todo1",
        userId: users[0].id
      }, {
        name: "todo2",
        userId: users[1].id
      }, {
        name: "todo3",
        userId: users[2].id
      }]);
  
      const todosData = await app.service("todos").find({
        query: {
          "user.team.name": { $in: ["team1", "team2"] }
        }
      });
  
      assert.deepStrictEqual(todosData.data, [{
        id: todos[0].id,
        name: "todo1",
        userId: users[0].id,
      }, {
        id: todos[1].id,
        name: "todo2",
        userId: users[1].id,
      }]);
    });
  
    it("can use joinQuery With $or", async function() {
      const { app } = await makeApp();
  
      const teams = await app.service("teams").create([{
        name: "team1"
      }, {
        name: "team2"
      }, {
        name: "team3"
      }]);
  
      const users = await app.service("users").create([{
        name: "user1",
        teamId: teams[0].id
      }, {
        name: "user2",
        teamId: teams[1].id
      }, {
        name: "user3",
        teamId: teams[2].id
      }]);
  
      const usersData = await app.service("users").find({
        query: {
          $or: [
            { "team.name": "team1" },
            { "team.name": "team2" }
          ]
        }
      });
  
      assert.deepStrictEqual(usersData.data, [{
        id: users[0].id,
        name: "user1",
        teamId: teams[0].id,
      }, {
        id: users[1].id,
        name: "user2",
        teamId: teams[1].id,
      }]);
    });
  
    it("can use joinQuery With $and", async function() {
      const { app } = await makeApp();
  
      const teams = await app.service("teams").create([{
        name: "team1",
        rating: 4
      }, {
        name: "team2",
        rating: 5
      }, {
        name: "team3",
        rating: 3
      }]);
  
      const users = await app.service("users").create([{
        name: "user1",
        teamId: teams[0].id
      }, {
        name: "user2",
        teamId: teams[1].id
      }, {
        name: "user3",
        teamId: teams[2].id
      }]);
  
      const usersData = await app.service("users").find({
        query: {
          $and: [
            {
              $or: [
                { "team.name": "team1" },
                { "team.name": "team2" }
              ],
            },
            { "team.rating": { $gt: 4 } }
          ]
        }
      });
  
      assert.deepStrictEqual(usersData.data, [{
        id: users[1].id,
        name: "user2",
        teamId: teams[1].id,
      }]);
    });
  
    it.skip("can query by hasMany association", async function() {
      const { app } = await makeApp();
  
      const teams = await app.service("teams").create([{
        name: "team1",
        rating: 4
      }, {
        name: "team2",
        rating: 5
      }, {
        name: "team3",
        rating: 3
      }]);
  
      const users = await app.service("users").create([{
        name: "user1",
        teamId: teams[0].id
      }, {
        name: "user2",
        teamId: teams[0].id
      }, {
        name: "user3",
        teamId: teams[0].id
      }, {
        name: "user4",
        teamId: teams[1].id
      }, {
        name: "user5",
        teamId: teams[1].id
      }, {
        name: "user6",
        teamId: teams[2].id
      }, {
        name: "user7",
        teamId: teams[2].id
      }]);
  
      const usersData = await app.service("teams").find({
        query: {
          "$users.name$": { $in: ["user1", "user2", "user7"] }
        }
      });
  
      assert.deepStrictEqual(usersData.data, [{
        id: users[1].id,
        name: "user2",
        teamId: teams[1].id,
      }]);
    });
  });
});