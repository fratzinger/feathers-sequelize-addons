import _get from "lodash/get";
import _set from "lodash/set";

/**
 * This is a feathers.js hook for feathers-sequelize
 * It allows querying for related models using the $notation$ notation and `sequelize.include`
 * You can use dot-notation, object-notation and $notation$. Each will transform to $notation$
 * `sequelize.include` will be added afterwards
 * 
 * 
 * @returns Hook
 */
export const joinQuery = () => async context => {
  // make query { 'team': { 'name': "team1" } } into { '$team.name$': "team1" }
  const transformAssociationObjectToFlatQuery = (
    query,
    Model,
    keysBefore: string[] = [],
  ) => {
    const { associations } = Model;

    const q = (keysBefore.length) ? _get(query, keysBefore) : query;

    for (const key in q) {
      const subQuery = q[key];
      if (
        !keysBefore.length && 
        ["$or", "$and"].includes(key) && 
        Array.isArray(subQuery)
      ) {
        subQuery.forEach(subQ => {
          transformAssociationObjectToFlatQuery(subQ, Model);
        });
        return;
      }
      if (associations[key]) {
        transformAssociationObjectToFlatQuery(query, associations[key].target, [...keysBefore, key]);
      } else if (keysBefore.length) {
        keysBefore.push(key);
        const newKey = keysBefore.join(".");
        query[`$${newKey}$`] = q[key];
        delete query[keysBefore[0]];
      }
    }
  };

  transformAssociationObjectToFlatQuery(params.query, service.Model);


  const getInclude = (service, key: string, providedInclude) => {
    if (!key) { return; }
    const include = [];
    if (providedInclude) {
      if (Array.isArray(providedInclude)) {
        include.push(...providedInclude);
      } else {
        include.push(providedInclude);
      }
    } 

    const { Model } = service;
    const { associations } = Model;

    const associationKeys = Object.keys(associations);

    const associationKey = associationKeys.find(association => key.startsWith(`${association}.`) || key.startsWith(`$${association}.`));
    if (!associationKey) { return; }

    const association = associations[associationKey];

    let associatedService, associatedServicePath;
    for (const servicePath in context.app.services) {
      const service = context.app.services[servicePath];
      if (service.Model === association.target) {
        associatedService = service;
        associatedServicePath = servicePath;
        break;
      }
    }
  
    if (!associatedService) {
      throw new Error(`Associated service not found for ${associationKey}`);
    }

    const existingInclude = include.find(x => {
      return x.model === association.target && x.as === associationKey;
    });

    const currentInclude = existingInclude || {
      model: association.target,
      as: associationKey,
      attributes: [],
    };

    if (!existingInclude) {
      include.push(currentInclude);
    }

    const dollar = (key.startsWith("$")) ? "$" : "";
    const subKey = key.substring(`${dollar}${associationKey}.`.length);

    const nestedInclude = getInclude(associatedService, subKey, currentInclude.include);

    if (nestedInclude && nestedInclude.length) {
      currentInclude.include = nestedInclude;
    }

    return include;
  };

  const { params, service } = context;
  params.query = params.query || {};

  // make query { 'team.name': 'team1' } into { '$team.name$': 'team1' }
  // and get sequelize include
  const transformQuery = (query: Record<string, any>, providedInclude) => {
    for (const key in query) {
      const q = query[key];
      if (["$or", "$and"].includes(key) && Array.isArray(query[key])) {
        // transform deeply
        query[key].forEach(subQuery => {
          const include = transformQuery(subQuery, providedInclude);
          if (include) {
            providedInclude = include;
          }
        });
      } else {
        const include = getInclude(service, key, providedInclude);
        if (include) {
          if (include.length && !key.startsWith("$")) {
            delete query[key];
            query[`$${key}$`] = q;
          }
  
          providedInclude = include;
        }
      }
    }

    return providedInclude;
  };

  const include = transformQuery(params.query, params.sequelize?.include);

  _set(params, "sequelize.include", include);

  return context;
};