import {
  InferAllSchemas,
  InferCurrentSchema,
  InferPreviousSchemas,
  VersionedSchema,
} from "../src";

describe("Versioned schema basic", () => {
  test("Type check", () => {
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

    expect(parser.latest({ version: 0, value: 1 }).value).toBe(true);
    expect(parser.latest({ version: 1, value: "2" }).value).toBe(false);
    expect(parser.latest({ version: 2, value: true }).value).toBe(true);
  });
});

describe("README examples", () => {
  test("Member example", () => {
    type MemberV1 = {
      version: 1;
      name: string;
    };

    function memberToV2(old: MemberV1): MemberV2 {
      const [firstName, lastName] = old.name.split(" ");
      return {
        version: 2,
        firstName,
        lastName,
      };
    }

    type MemberV2 = {
      version: 2;
      firstName: string;
      lastName: string;
    };

    function memberToV3(old: MemberV2): MemberV3 {
      return {
        ...old,
        version: 3,
        permission: "write",
        updatedAt: new Date(),
      };
    }

    type MemberV3 = {
      version: 3;
      firstName: string;
      lastName: string;
      permission: "write" | "read";
      updatedAt: Date;
    };

    const memberConverter = new VersionedSchema("version")
      .version<MemberV1>(1)
      .version<MemberV2>(2, memberToV2)
      .version<MemberV3>(3, memberToV3);

    type MemberLatest = InferCurrentSchema<typeof memberConverter>;
    type MemberOld = InferPreviousSchemas<typeof memberConverter>;
    type MemberStored = InferAllSchemas<typeof memberConverter>;

    // latest(data: MemberV1 | MemberV2 | MemberV3): MemberV3
    const latest = memberConverter.latest({
      version: 1,
      name: "John Doe",
    });

    expect(latest.version).toBe(3);
    expect(latest.firstName).toBe("John");
    expect(latest.lastName).toBe("Doe");
    expect(latest.permission).toBe("write");
  });
});
