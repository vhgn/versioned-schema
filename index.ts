type Versioned<TKey extends string> = {
  [key in TKey]: unknown;
};

export class VersionedSchema<TVersionKey extends string> {
  constructor(public key: TVersionKey) {
    //
  }

  version<TInitialVersion extends Versioned<TVersionKey>>(
    value: TInitialVersion[TVersionKey],
  ) {
    return new VersionDefinition<TVersionKey, TInitialVersion, never>(
      this.key,
      value,
      () => {
        throw new Error("Initial");
      },
    );
  }
}

export class VersionDefinition<
  TVersionKey extends string,
  TCurrentSchema extends Versioned<TVersionKey>,
  TPreviousSchemas extends Versioned<TVersionKey>,
> {
  constructor(
    public key: TVersionKey,
    public value: TCurrentSchema[TVersionKey],
    public converter: (prev: TPreviousSchemas) => TCurrentSchema,
  ) {
    //
  }

  newest(obj: TPreviousSchemas | TCurrentSchema): TCurrentSchema {
    if (
      isLatest<TVersionKey, TCurrentSchema, TPreviousSchemas>(
        this.key,
        this.value,
        obj,
      )
    ) {
      return obj;
    }

    return this.converter(obj);
  }

  version<TNextVersion extends Versioned<TVersionKey>>(
    value: TNextVersion[TVersionKey],
    converter: (prev: TCurrentSchema) => TNextVersion,
  ) {
    return new VersionDefinition<
      TVersionKey,
      TNextVersion,
      TPreviousSchemas | TCurrentSchema
    >(this.key, value, (obj) => converter(this.newest(obj)));
  }

  compile() {
    return this.newest;
  }
}

function isLatest<
  TKey extends string,
  TLatest extends Versioned<TKey>,
  TPrevious extends Versioned<TKey>,
>(key: TKey, value: TLatest[TKey], obj: TLatest | TPrevious): obj is TLatest {
  return obj[key] === value;
}

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

console.log(parser.newest({ version: 0, value: 0 }));
console.log(parser.newest({ version: 1, value: "2" }));
console.log(parser.newest({ version: 2, value: true }));
