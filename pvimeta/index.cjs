ClassesCommon = [
    {
        Name: "Event",
        Base: "",
        Components: [
            {
                Name: "TimeStamp",
                Type: "TIMESTAMP"
            },
            {
                Name: "EventInfo",
                Type: "TEXT"
            }
        ],
        Children: [],
        References: [],
        Extensions: [
            {
                Name: "Message",
                Components: [
                    {
                        Name: "From",
                        Type: "VARCHAR",
                        Length: 255
                    },
                    {
                        Name: "To",
                        Type: "VARCHAR",
                        Length: 255
                    }
                ],
                Children: [],
                References: [],
                Extensions: [
                    {
                        Name: "Email",
                        Components: [],
                        Children: [],
                        References: [
                            {
                                Name: "EmailAddress",
                                ReferredClass: "EmailAddress"
                            }
                        ],
                        Extensions: []
                    },
                    {
                        Name: "Text",
                        Components: [],
                        Children: [],
                        References: [],
                        Extensions: []
                    },
                    {
                        Name: "Voicemail",
                        Components: [],
                        Children: [],
                        References: [],
                        Extensions: []
                    }
                ]
            }
        ]
    },
    {
        Name: "Party",
        Base: "",
        Components: [
            {
                Name: "Name",
                Type: "VARCHAR",
                Length: 255
            },
            {
                "Name": "StreetAddress",
                "EmbeddedClass": "StreetAddress"
            },
            {
                "Name": "EmailAddress",
                "EmbeddedClass": "EmailAddress"
            },
            {
                "Name": "PhoneNumber",
                "EmbeddedClass": "PhoneNumber"
            },
            {
                "Name": "AltPhoneNumber",
                "EmbeddedClass": "PhoneNumber"
            }
        ],
        Children: [
            {
                "Name": "Places",
                "ChildClass": "Place"
            }
        ],
        References: [],
        Extensions: [
            {
                Name: "Person",
                Components: [],
                Children: [],
                References: [],
                Extensions: []
            }
        ]
    },
    {
        Name: "Place",
        Base: "",
        Components: [
            {
                Name: "Name",
                Type: "VARCHAR",
                Length: 255
            }
        ],
        Children: [],
        References: [],
        Extensions: [
            {
                Name: "EmailAddress",
                Components: [
                    {
                        Name: "Domain",
                        Type: "VARCHAR",
                        Length: 255
                    },
                    {
                        Name: "Name",
                        Type: "VARCHAR",
                        Length: 255
                    }
                ],
                Children: [],
                References: [],
                Extensions: []
            },
            {
                Name: "PhoneNumber",
                Components: [
                    {
                        Name: "CountryCode",
                        Type: "VARCHAR",
                        Length: 255
                    },
                    {
                        Name: "AreaCode",
                        Type: "VARCHAR",
                        Length: 255
                    },
                    {
                        Name: "Exchange",
                        Type: "VARCHAR",
                        Length: 255
                    },
                    {
                        Name: "ActualNumber",
                        Type: "VARCHAR",
                        Length: 255
                    },
                    {
                        Name: "ExtensionNumber",
                        Type: "VARCHAR",
                        Length: 255
                    }
                ],
                Children: [],
                References: [],
                Extensions: []
            },
            {
                Name: "StreetAddress",
                Components: [
                    {
                        Name: "Street1",
                        Type: "VARCHAR",
                        Length: 255
                    },
                    {
                        Name: "Street2",
                        Type: "VARCHAR",
                        Length: 255
                    },
                    {
                        Name: "Street3",
                        Type: "VARCHAR",
                        Length: 255
                    },
                    {
                        Name: "City",
                        Type: "VARCHAR",
                        Length: 255
                    },
                    {
                        Name: "StateProvince",
                        Type: "VARCHAR",
                        Length: 255
                    },
                    {
                        Name: "ZipPostalCode",
                        Type: "VARCHAR",
                        Length: 255
                    },
                    {
                        Name: "Country",
                        Type: "VARCHAR",
                        Length: 255
                    }
                ],
                Children: [],
                References: [],
                Extensions: []
            },
            {
                Name: "SocialAddress",
                Components: [
                    {
                        Name: "Platform",
                        Type: "VARCHAR",
                        Length: 255
                    },
                    {
                        Name: "Identifier",
                        Type: "VARCHAR",
                        Length: 255
                    }
                ],
                Children: [],
                References: [],
                Extensions: []
            }
        ]
    },
    {
        Name: "Thing",
        Base: "",
        Components: [
            {
                Name: "Name",
                Type: "VARCHAR",
                Length: 255
            }
        ],
        Children: [],
        References: [],
        Extensions: []
    },
    {
        Name: "Attachment",
        Base: "",
        Components: [
            {
                Name: "FileName",
                Type: "VARCHAR",
                Length: 4096
            },
            {
                Name: "MimeType",
                Type: "VARCHAR",
                Length: 255
            },
            {
                Name: "Length",
                Type: "BIGINT"
            },
            {
                Name: "StorageId",
                Type: "UUID"
            },
            {
                Name: "StoragePath",
                Type: "VARCHAR",
                Length: 4096
            }
        ],
        Children: [],
        References: [],
        Extensions: []
    }
];

UseCasesCommon = [];

module.exports = {
    ClassesCommon: ClassesCommon,
    UseCasesCommon: UseCasesCommon
}