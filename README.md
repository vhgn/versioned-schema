# Versioned Schema

> Define a type with a version specifier and incrementally add conversion functions.
> Get the latest version from any older version with type checking

# Examples

Just create a type for the initial version, and when you need a breaking change
create a converter to the next version and always use the type for the latest version
inside your project

```ts
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

// latest(data: MemberV1 | MemberV2 | MemberV3): MemberV3
const latest = memberConverter.latest({ version: 1, name: "John Doe" });

expect(latest.version).toBe(3);
expect(latest.firstName).toBe("John");
expect(latest.lastName).toBe("Doe");
expect(latest.permission).toBe("write");
```

- Infer the latest schema to use in your project with utility `InferCurrentSchema`
- Infer all schemas that might be stored and may need to upgrade with utility `InferAllSchemas`

```ts
type MemberLatest = InferCurrentSchema<typeof memberConverter>;
type MemberOld = InferPreviousSchemas<typeof memberConverter>;
type MemberStored = InferAllSchemas<typeof memberConverter>;
```

# Other

Feature requests are welcome
