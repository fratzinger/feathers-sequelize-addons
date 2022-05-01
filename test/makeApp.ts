// const sequelize = new Sequelize("sequelize", "", "", {
//   dialect: "sqlite",
//   storage: path.join(__dirname, "../../../.data/db.sqlite"),
//   logging: false
// });

import { DataTypes, Sequelize } from "sequelize";
import { joinQuery } from "../src";
import feathers from "@feathersjs/feathers";
import { Service } from "feathers-sequelize";

export const makeApp = async () => {
  const sequelize = new Sequelize("sqlite::memory:", {
    logging: false
  });

  const User = sequelize.define("users", {
    name: {
      type: DataTypes.STRING
    },
  }, {
    timestamps: false
  });

  const Team = sequelize.define("teams", {
    name: {
      type: DataTypes.STRING
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    timestamps: false
  });

  const Todo = sequelize.define("todos", {
    name: {
      type: DataTypes.STRING
    },
  }, {
    timestamps: false
  });

  User.belongsTo(Team, {
    as: "team",
    foreignKey: {
      name: "teamId",
      allowNull: true
    }
  });

  Team.hasMany(User, {
    as: "users",
    foreignKey: {
      name: "teamId",
      allowNull: true
    }
  });

  Todo.belongsTo(User, {
    as: "user",
    foreignKey: {
      name: "userId",
      allowNull: true
    }
  });

  User.hasMany(Todo, {
    as: "todos",
    foreignKey: {
      name: "userId",
      allowNull: true
    }
  });

  await sequelize.sync();
  const app = feathers();
  app.use("/users", new Service({
    Model: User,
    paginate: {
      default: 10,
      max: 25
    },
    multi: true,
    whitelist: [
      "$team.name$",
      "$team.rating$"
    ]
  }));

  const users = app.service("users");
  users.hooks({
    before: {
      all: [],
      find: [joinQuery()],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    },
    after: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    }
  });

  app.use("/teams", new Service({
    Model: Team,
    paginate: {
      default: 10,
      max: 25
    },
    multi: true
  }));

  const teams = app.service("teams");
  teams.hooks({
    before: {
      all: [],
      find: [joinQuery()],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    },
    after: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    }
  });

  app.use("/todos", new Service({
    Model: Todo,
    paginate: {
      default: 10,
      max: 25
    },
    multi: true,
    whitelist: [
      "$user.name$",
      "$user.team.name$"
    ]
  }));

  const todos = app.service("todos");
  todos.hooks({
    before: {
      all: [],
      find: [joinQuery()],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    },
    after: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    }
  });

  return {
    app,
    users,
    teams,
    todos
  };
};