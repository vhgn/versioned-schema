import { VersionedSchema } from "..";

type Initial = { version: 0; value: number };
type Middle = { version: 1; value: string };
type Latest = { version: 2; value: boolean };
const parser = new VersionedSchema("version")
  .version<Initial>(0)
  .version<Middle>(1, (old) => {
    return {
      version: 1,
      value: old.value.toString(),
    };
  })
  .version<Latest>(2, (old) => {
    return {
      version: 2,
      value: old.value === "1",
    };
  });

console.log(parser.newest({ version: 0, value: 1 }));
console.log(parser.newest({ version: 1, value: "2" }));
console.log(parser.newest({ version: 2, value: true }));
