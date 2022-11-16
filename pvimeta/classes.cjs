[
    {
        Name: "Event",
        Base: "",
        Components: [,
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
                        Name: "Email"
                    },
                    {
                        Name: "Text"
                    },
                    {
                        Name: "Voicemail"
                    }
                ]
            },
            {
                Name: "Task"
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
            }
        ],
        Children: [],
        References: [],
        Extensions: [
            {
                Name: "Person"
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
        Extensions: []
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
]
