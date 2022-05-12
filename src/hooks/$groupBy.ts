import { BadRequest } from "@feathersjs/errors";

export const $groupBy = () => context => {
  const { params } = context;

  if (params.query && !("$groupBy" in params.query)) { return; }

  if (typeof params.query?.$groupBy !== "string") {
    throw new BadRequest("$groupBy must be a string");
  }

  params.sequelize = params.sequelize || {};
  params.sequelize.group = [params.query.$groupBy];
  delete params.query.$groupBy;

  return context;
};