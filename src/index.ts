export type InferCurrentSchema<TVersionDefinition> =
  TVersionDefinition extends VersionDefinition<any, infer TCurrentSchema, any>
    ? TCurrentSchema
    : never;

export type InferPreviousSchemas<TVersionDefinition> =
  TVersionDefinition extends VersionDefinition<any, any, infer TPreviousSchemas>
    ? TPreviousSchemas
    : never;

export type InferAllSchemas<TVersionDefinition> =
  TVersionDefinition extends VersionDefinition<
    any,
    infer TCurrentSchema,
    infer TPreviousSchemas
  >
    ? TCurrentSchema | TPreviousSchemas
    : never;

type WithVersionSpecifier<TVersionKey extends string> = {
  [key in TVersionKey]: unknown;
};

export class VersionedSchema<TVersionKey extends string> {
  constructor(private key: TVersionKey) {
    //
  }

  version<TInitialVersion extends WithVersionSpecifier<TVersionKey>>(
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
  TCurrentSchema extends WithVersionSpecifier<TVersionKey>,
  TPreviousSchemas extends WithVersionSpecifier<TVersionKey>,
> {
  public constructor(
    private key: TVersionKey,
    private value: TCurrentSchema[TVersionKey],
    private converter: (data: TPreviousSchemas) => TCurrentSchema,
  ) {
    //
  }

  public latest(data: TPreviousSchemas | TCurrentSchema): TCurrentSchema {
    if (
      isCurrentVersion<TVersionKey, TCurrentSchema, TPreviousSchemas>(
        this.key,
        this.value,
        data,
      )
    ) {
      return data;
    }

    return this.converter(data);
  }

  public version<TNextSchemaVersion extends WithVersionSpecifier<TVersionKey>>(
    value: TNextSchemaVersion[TVersionKey],
    converter: (data: TCurrentSchema) => TNextSchemaVersion,
  ) {
    return new VersionDefinition<
      TVersionKey,
      TNextSchemaVersion,
      TPreviousSchemas | TCurrentSchema
    >(this.key, value, (data) => converter(this.latest(data)));
  }
}

function isCurrentVersion<
  TVersionKey extends string,
  TCurrentVersion extends WithVersionSpecifier<TVersionKey>,
  TPreviousVersions extends WithVersionSpecifier<TVersionKey>,
>(
  key: TVersionKey,
  value: TCurrentVersion[TVersionKey],
  data: TCurrentVersion | TPreviousVersions,
): data is TCurrentVersion {
  return data[key] === value;
}
