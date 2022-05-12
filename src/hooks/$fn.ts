// import _get from "lodash/get";
// import _set from "lodash/set";

// export const $fn = () => context => {
//   const query = Object.assign({}, context.params.query);

//   const transformFn = (query: any) => {
//     for (const key in query) {
//       if (key === "$fn") {

//       }

//       const q = query[key];
//       if (typeof q === "object") {
//         transformFn(q);
//       } else if (Array.isArray(q)) {
//         q.forEach(subQ => {
//           transformFn(subQ);
//         });
//       }
//     }
//   };

//   transformFn(query);
// };