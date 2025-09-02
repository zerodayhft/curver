/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/curver.json`.
 */
export type Curver = {
    "address": "Bw42ZPFART722nwPfVk5egiECYRxBCTqo1LpRtAA5mxr",
    "metadata": {
        "name": "curver",
        "version": "0.1.0",
        "spec": "0.1.0",
        "description": "Created with Anchor"
    },
    "instructions": [
        {
            "name": "buy",
            "discriminator": [
                102,
                6,
                61,
                18,
                1,
                218,
                235,
                234
            ],
            "accounts": [
                {
                    "name": "user",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "mint",
                    "writable": true
                },
                {
                    "name": "bondingCurve",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    98,
                                    111,
                                    110,
                                    100,
                                    105,
                                    110,
                                    103,
                                    95,
                                    99,
                                    117,
                                    114,
                                    118,
                                    101
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "mint"
                            }
                        ]
                    }
                },
                {
                    "name": "solVault",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    115,
                                    111,
                                    108,
                                    95,
                                    118,
                                    97,
                                    117,
                                    108,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "mint"
                            }
                        ]
                    }
                },
                {
                    "name": "userTokenAccount",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account",
                                "path": "user"
                            },
                            {
                                "kind": "const",
                                "value": [
                                    6,
                                    221,
                                    246,
                                    225,
                                    215,
                                    101,
                                    161,
                                    147,
                                    217,
                                    203,
                                    225,
                                    70,
                                    206,
                                    235,
                                    121,
                                    172,
                                    28,
                                    180,
                                    133,
                                    237,
                                    95,
                                    91,
                                    55,
                                    145,
                                    58,
                                    140,
                                    245,
                                    133,
                                    126,
                                    255,
                                    0,
                                    169
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "mint"
                            }
                        ],
                        "program": {
                            "kind": "const",
                            "value": [
                                140,
                                151,
                                37,
                                143,
                                78,
                                36,
                                137,
                                241,
                                187,
                                61,
                                16,
                                41,
                                20,
                                142,
                                13,
                                131,
                                11,
                                90,
                                19,
                                153,
                                218,
                                255,
                                16,
                                132,
                                4,
                                142,
                                123,
                                216,
                                219,
                                233,
                                248,
                                89
                            ]
                        }
                    }
                },
                {
                    "name": "global",
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    103,
                                    108,
                                    111,
                                    98,
                                    97,
                                    108
                                ]
                            }
                        ]
                    }
                },
                {
                    "name": "globalConfig",
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    103,
                                    108,
                                    111,
                                    98,
                                    97,
                                    108,
                                    95,
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103,
                                    95,
                                    115,
                                    116,
                                    97,
                                    116,
                                    101
                                ]
                            }
                        ]
                    }
                },
                {
                    "name": "protocolOwner",
                    "writable": true
                },
                {
                    "name": "tokenCreator",
                    "writable": true
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                },
                {
                    "name": "tokenProgram",
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                },
                {
                    "name": "associatedTokenProgram",
                    "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
                }
            ],
            "args": [
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "create",
            "discriminator": [
                24,
                30,
                200,
                40,
                5,
                28,
                7,
                119
            ],
            "accounts": [
                {
                    "name": "mint",
                    "writable": true
                },
                {
                    "name": "mintAuthority",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "globalConfig",
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    103,
                                    108,
                                    111,
                                    98,
                                    97,
                                    108,
                                    95,
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103,
                                    95,
                                    115,
                                    116,
                                    97,
                                    116,
                                    101
                                ]
                            }
                        ]
                    }
                },
                {
                    "name": "bondingCurve",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    98,
                                    111,
                                    110,
                                    100,
                                    105,
                                    110,
                                    103,
                                    95,
                                    99,
                                    117,
                                    114,
                                    118,
                                    101
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "mint"
                            }
                        ]
                    }
                },
                {
                    "name": "associatedBondingCurve",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account",
                                "path": "bondingCurve"
                            },
                            {
                                "kind": "const",
                                "value": [
                                    6,
                                    221,
                                    246,
                                    225,
                                    215,
                                    101,
                                    161,
                                    147,
                                    217,
                                    203,
                                    225,
                                    70,
                                    206,
                                    235,
                                    121,
                                    172,
                                    28,
                                    180,
                                    133,
                                    237,
                                    95,
                                    91,
                                    55,
                                    145,
                                    58,
                                    140,
                                    245,
                                    133,
                                    126,
                                    255,
                                    0,
                                    169
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "mint"
                            }
                        ],
                        "program": {
                            "kind": "const",
                            "value": [
                                140,
                                151,
                                37,
                                143,
                                78,
                                36,
                                137,
                                241,
                                187,
                                61,
                                16,
                                41,
                                20,
                                142,
                                13,
                                131,
                                11,
                                90,
                                19,
                                153,
                                218,
                                255,
                                16,
                                132,
                                4,
                                142,
                                123,
                                216,
                                219,
                                233,
                                248,
                                89
                            ]
                        }
                    }
                },
                {
                    "name": "solVault",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    115,
                                    111,
                                    108,
                                    95,
                                    118,
                                    97,
                                    117,
                                    108,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "mint"
                            }
                        ]
                    }
                },
                {
                    "name": "global",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    103,
                                    108,
                                    111,
                                    98,
                                    97,
                                    108
                                ]
                            }
                        ]
                    }
                },
                {
                    "name": "metadata",
                    "writable": true
                },
                {
                    "name": "tokenMetadataProgram",
                    "address": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
                },
                {
                    "name": "tokenProgram",
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                },
                {
                    "name": "associatedTokenProgram",
                    "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                },
                {
                    "name": "rent",
                    "address": "SysvarRent111111111111111111111111111111111"
                }
            ],
            "args": [
                {
                    "name": "args",
                    "type": {
                        "defined": {
                            "name": "createArgs"
                        }
                    }
                }
            ]
        },
        {
            "name": "initialize",
            "discriminator": [
                175,
                175,
                109,
                31,
                13,
                152,
                155,
                237
            ],
            "accounts": [
                {
                    "name": "authority",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "globalConfig",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    103,
                                    108,
                                    111,
                                    98,
                                    97,
                                    108,
                                    95,
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103,
                                    95,
                                    115,
                                    116,
                                    97,
                                    116,
                                    101
                                ]
                            }
                        ]
                    }
                },
                {
                    "name": "global",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    103,
                                    108,
                                    111,
                                    98,
                                    97,
                                    108
                                ]
                            }
                        ]
                    }
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                }
            ],
            "args": []
        },
        {
            "name": "sell",
            "discriminator": [
                51,
                230,
                133,
                164,
                1,
                127,
                131,
                173
            ],
            "accounts": [
                {
                    "name": "user",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "mint",
                    "writable": true
                },
                {
                    "name": "bondingCurve",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    98,
                                    111,
                                    110,
                                    100,
                                    105,
                                    110,
                                    103,
                                    95,
                                    99,
                                    117,
                                    114,
                                    118,
                                    101
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "mint"
                            }
                        ]
                    }
                },
                {
                    "name": "solVault",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    115,
                                    111,
                                    108,
                                    95,
                                    118,
                                    97,
                                    117,
                                    108,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "mint"
                            }
                        ]
                    }
                },
                {
                    "name": "userTokenAccount",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account",
                                "path": "user"
                            },
                            {
                                "kind": "const",
                                "value": [
                                    6,
                                    221,
                                    246,
                                    225,
                                    215,
                                    101,
                                    161,
                                    147,
                                    217,
                                    203,
                                    225,
                                    70,
                                    206,
                                    235,
                                    121,
                                    172,
                                    28,
                                    180,
                                    133,
                                    237,
                                    95,
                                    91,
                                    55,
                                    145,
                                    58,
                                    140,
                                    245,
                                    133,
                                    126,
                                    255,
                                    0,
                                    169
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "mint"
                            }
                        ],
                        "program": {
                            "kind": "const",
                            "value": [
                                140,
                                151,
                                37,
                                143,
                                78,
                                36,
                                137,
                                241,
                                187,
                                61,
                                16,
                                41,
                                20,
                                142,
                                13,
                                131,
                                11,
                                90,
                                19,
                                153,
                                218,
                                255,
                                16,
                                132,
                                4,
                                142,
                                123,
                                216,
                                219,
                                233,
                                248,
                                89
                            ]
                        }
                    }
                },
                {
                    "name": "global",
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    103,
                                    108,
                                    111,
                                    98,
                                    97,
                                    108
                                ]
                            }
                        ]
                    }
                },
                {
                    "name": "globalConfig",
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    103,
                                    108,
                                    111,
                                    98,
                                    97,
                                    108,
                                    95,
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103,
                                    95,
                                    115,
                                    116,
                                    97,
                                    116,
                                    101
                                ]
                            }
                        ]
                    }
                },
                {
                    "name": "protocolOwner",
                    "writable": true
                },
                {
                    "name": "tokenCreator",
                    "writable": true
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                },
                {
                    "name": "tokenProgram",
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                }
            ],
            "args": [
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "updateConfig",
            "discriminator": [
                29,
                158,
                252,
                191,
                10,
                83,
                219,
                99
            ],
            "accounts": [
                {
                    "name": "authority",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "globalConfig",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    103,
                                    108,
                                    111,
                                    98,
                                    97,
                                    108,
                                    95,
                                    99,
                                    111,
                                    110,
                                    102,
                                    105,
                                    103,
                                    95,
                                    115,
                                    116,
                                    97,
                                    116,
                                    101
                                ]
                            }
                        ]
                    }
                },
                {
                    "name": "global",
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    103,
                                    108,
                                    111,
                                    98,
                                    97,
                                    108
                                ]
                            }
                        ]
                    }
                }
            ],
            "args": [
                {
                    "name": "feeRecipientBasisPoints",
                    "type": "u64"
                },
                {
                    "name": "creatorFeeBasisPoints",
                    "type": "u64"
                },
                {
                    "name": "protocolFeeBasisPoints",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "updateGlobal",
            "discriminator": [
                90,
                152,
                240,
                21,
                199,
                38,
                72,
                20
            ],
            "accounts": [
                {
                    "name": "authority",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "global",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    103,
                                    108,
                                    111,
                                    98,
                                    97,
                                    108
                                ]
                            }
                        ]
                    }
                }
            ],
            "args": [
                {
                    "name": "newTokenOwner",
                    "type": {
                        "option": "pubkey"
                    }
                }
            ]
        }
    ],
    "accounts": [
        {
            "name": "bondingCurveState",
            "discriminator": [
                182,
                185,
                75,
                193,
                72,
                40,
                132,
                153
            ]
        },
        {
            "name": "global",
            "discriminator": [
                167,
                232,
                232,
                177,
                200,
                108,
                114,
                127
            ]
        },
        {
            "name": "globalConfigState",
            "discriminator": [
                106,
                46,
                39,
                206,
                15,
                122,
                34,
                59
            ]
        },
        {
            "name": "solVault",
            "discriminator": [
                21,
                132,
                230,
                103,
                19,
                209,
                129,
                248
            ]
        }
    ],
    "events": [
        {
            "name": "curveCreated",
            "discriminator": [
                207,
                148,
                202,
                45,
                236,
                100,
                171,
                230
            ]
        },
        {
            "name": "reservesUpdated",
            "discriminator": [
                183,
                120,
                189,
                251,
                130,
                178,
                85,
                121
            ]
        },
        {
            "name": "tokensBuy",
            "discriminator": [
                202,
                111,
                241,
                189,
                149,
                167,
                219,
                83
            ]
        },
        {
            "name": "tokensSell",
            "discriminator": [
                27,
                175,
                114,
                244,
                8,
                213,
                88,
                92
            ]
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "invalidReserves",
            "msg": "Invalid reserve configuration"
        },
        {
            "code": 6001,
            "name": "invalidMint",
            "msg": "Invalid mint address"
        },
        {
            "code": 6002,
            "name": "invalidSupply",
            "msg": "Invalid total supply"
        },
        {
            "code": 6003,
            "name": "invalidAuthority",
            "msg": "Invalid authority"
        },
        {
            "code": 6004,
            "name": "invalidConfig",
            "msg": "Invalid config addr"
        },
        {
            "code": 6005,
            "name": "invalidAmount",
            "msg": "Invalid amount for swap"
        },
        {
            "code": 6006,
            "name": "insufficientFunds",
            "msg": "Insufficient funds on curve"
        },
        {
            "code": 6007,
            "name": "calculationError",
            "msg": "Calculation error"
        },
        {
            "code": 6008,
            "name": "insufficientLiquidity",
            "msg": "Insufficient liquidity"
        },
        {
            "code": 6009,
            "name": "insufficientTokens",
            "msg": "Insufficient tokens"
        },
        {
            "code": 6010,
            "name": "invalidProtocolOwner",
            "msg": "Invalid protocol owner address"
        },
        {
            "code": 6011,
            "name": "invalidCreatorAddress",
            "msg": "Invalid creator address"
        }
    ],
    "types": [
        {
            "name": "bondingCurveState",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "vtokenReserve",
                        "type": "u64"
                    },
                    {
                        "name": "vtokenMint",
                        "type": "pubkey"
                    },
                    {
                        "name": "vsolReserve",
                        "type": "u64"
                    },
                    {
                        "name": "totalSupply",
                        "type": "u64"
                    },
                    {
                        "name": "allocationAtMigration",
                        "type": "u64"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    }
                ]
            }
        },
        {
            "name": "createArgs",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "name": "symbol",
                        "type": "string"
                    },
                    {
                        "name": "uri",
                        "type": "string"
                    }
                ]
            }
        },
        {
            "name": "curveCreated",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "mint",
                        "type": "pubkey"
                    },
                    {
                        "name": "creator",
                        "type": "pubkey"
                    },
                    {
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "name": "symbol",
                        "type": "string"
                    },
                    {
                        "name": "uri",
                        "type": "string"
                    },
                    {
                        "name": "initialVtokenReserve",
                        "type": "u64"
                    },
                    {
                        "name": "initialVsolReserve",
                        "type": "u64"
                    },
                    {
                        "name": "totalSupply",
                        "type": "u64"
                    },
                    {
                        "name": "timestamp",
                        "type": "i64"
                    }
                ]
            }
        },
        {
            "name": "global",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "protocolOwner",
                        "type": "pubkey"
                    },
                    {
                        "name": "tokenCreator",
                        "type": "pubkey"
                    },
                    {
                        "name": "tokenOwner",
                        "type": "pubkey"
                    },
                    {
                        "name": "globalConfig",
                        "type": "pubkey"
                    },
                    {
                        "name": "initialVirtualTokenReserves",
                        "type": "u64"
                    },
                    {
                        "name": "initialVirtualSolReserves",
                        "type": "u64"
                    },
                    {
                        "name": "initialRealTokenReserves",
                        "type": "u64"
                    },
                    {
                        "name": "tokenTotalSupply",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "globalConfigState",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "protocolOwner",
                        "type": "pubkey"
                    },
                    {
                        "name": "protocolFeeBasisPoints",
                        "type": "u64"
                    },
                    {
                        "name": "creatorFeeBasisPoints",
                        "type": "u64"
                    },
                    {
                        "name": "tokenOwnerFeeBasisPoints",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "reservesUpdated",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "mint",
                        "type": "pubkey"
                    },
                    {
                        "name": "oldVtokenReserve",
                        "type": "u64"
                    },
                    {
                        "name": "newVtokenReserve",
                        "type": "u64"
                    },
                    {
                        "name": "oldVsolReserve",
                        "type": "u64"
                    },
                    {
                        "name": "newVsolReserve",
                        "type": "u64"
                    },
                    {
                        "name": "timestamp",
                        "type": "i64"
                    }
                ]
            }
        },
        {
            "name": "solVault",
            "docs": [
                "Vault аккаунт для хранения SOL",
                "Это простой системный аккаунт, контролируемый bonding curve PDA"
            ],
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "tokenMint",
                        "docs": [
                            "Pubkey mint токена, для которого создан этот vault"
                        ],
                        "type": "pubkey"
                    },
                    {
                        "name": "bump",
                        "docs": [
                            "Bump seed для PDA"
                        ],
                        "type": "u8"
                    },
                    {
                        "name": "accumulatedProtocolFees",
                        "docs": [
                            "Накопленные комиссии протокола в lamports"
                        ],
                        "type": "u64"
                    },
                    {
                        "name": "accumulatedCreatorFees",
                        "docs": [
                            "Накопленные комиссии создателя токена в lamports"
                        ],
                        "type": "u64"
                    },
                    {
                        "name": "accumulatedOwnerFees",
                        "docs": [
                            "Накопленные комиссии владельца токена в lamports"
                        ],
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "tokensBuy",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "mint",
                        "type": "pubkey"
                    },
                    {
                        "name": "buyer",
                        "type": "pubkey"
                    },
                    {
                        "name": "solAmount",
                        "type": "u64"
                    },
                    {
                        "name": "tokensReceived",
                        "type": "u64"
                    },
                    {
                        "name": "protocolFee",
                        "type": "u64"
                    },
                    {
                        "name": "creatorFee",
                        "type": "u64"
                    },
                    {
                        "name": "vtokenReserveAfter",
                        "type": "u64"
                    },
                    {
                        "name": "vsolReserveAfter",
                        "type": "u64"
                    },
                    {
                        "name": "currentPrice",
                        "type": "u64"
                    },
                    {
                        "name": "timestamp",
                        "type": "i64"
                    }
                ]
            }
        },
        {
            "name": "tokensSell",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "mint",
                        "type": "pubkey"
                    },
                    {
                        "name": "seller",
                        "type": "pubkey"
                    },
                    {
                        "name": "tokensSold",
                        "type": "u64"
                    },
                    {
                        "name": "solReceived",
                        "type": "u64"
                    },
                    {
                        "name": "protocolFee",
                        "type": "u64"
                    },
                    {
                        "name": "creatorFee",
                        "type": "u64"
                    },
                    {
                        "name": "vtokenReserveAfter",
                        "type": "u64"
                    },
                    {
                        "name": "vsolReserveAfter",
                        "type": "u64"
                    },
                    {
                        "name": "currentPrice",
                        "type": "u64"
                    },
                    {
                        "name": "timestamp",
                        "type": "i64"
                    }
                ]
            }
        }
    ]
};
