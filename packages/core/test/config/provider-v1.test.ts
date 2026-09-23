import { describe, expect, test } from "bun:test"
import { Schema } from "effect"
import { ConfigProviderV1 } from "@opencode-ai/core/v1/config/provider"
import { ConfigV1 } from "@opencode-ai/core/v1/config/config"
import { ConfigMigrateV1 } from "@opencode-ai/core/v1/config/migrate"
import { Config } from "@opencode-ai/core/config"

const decode = Schema.decodeUnknownSync(ConfigProviderV1.Info)

describe("ConfigProviderV1 model limit overrides", () => {
  test.each([
    { context: 131072 },
    { output: 8192 },
    { input: 65536 },
    { context: 131072, output: 8192 },
    { context: 131072, input: 65536, output: 8192 },
    {},
  ])("preserves independently supplied limits %j without fabricating missing fields", (limit) => {
    expect(decode({ models: { "openrouter/free": { limit } } })).toEqual({
      models: { "openrouter/free": { limit } },
    })
  })

  test("accepts omitted limits without adding defaults", () => {
    expect(decode({ models: { "openrouter/free": { name: "Free route" } } })).toEqual({
      models: { "openrouter/free": { name: "Free route" } },
    })
  })

  test.each([{ context: 131072 }, { output: 8192 }, { input: 65536 }, {}])(
    "migrates partial limits %j through the current config schema",
    (limit) => {
      const legacy = Schema.decodeUnknownSync(ConfigV1.Info)({
        provider: { openrouter: { models: { "openrouter/free": { limit } } } },
      })
      const migrated = Schema.decodeUnknownSync(Config.Info)(ConfigMigrateV1.migrate(legacy))
      expect(migrated.providers?.openrouter?.models?.["openrouter/free"]?.limit).toEqual({
        context: undefined,
        input: undefined,
        output: undefined,
        ...limit,
      })
    },
  )

  for (const field of ["context", "input", "output"]) {
    test.each(["8192", null, true, [], {}, NaN, Infinity, -Infinity].map((value) => ({ value })))(
      `rejects invalid ${field} limit %j`,
      (sample) => {
        expect(() => decode({ models: { "openrouter/free": { limit: { [field]: sample.value } } } })).toThrow()
      },
    )
  }
})
