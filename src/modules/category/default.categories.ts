import { CategoryType } from "src/shared/enums/category";

interface CategoryData {
    name: string;
    icon: string;
    type: CategoryType;
    editable: boolean;
    children?: CategoryData[];
}

export const categories: CategoryData[] = [
    {
        name: "Food & Drinks",
        icon: "fastfood",
        type: CategoryType.EXPENSE,
        editable: false,
        children: [
            {
                name: "Restaurant",
                icon: "receipt",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Dinner",
                icon: "food-turkey",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Fast Food",
                icon: "hamburger",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Coffee",
                icon: "local_cafe",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Wine & Beer",
                icon: "local_bar_sharp",
                type: CategoryType.EXPENSE,
                editable: true
            }
        ]
    },
    {
        name: "Children",
        icon: 'groups',
        type: CategoryType.EXPENSE,
        editable: false,
        children: [
            {
                name: "Study",
                icon: "school",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Toys",
                icon: "gamepad-variant",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Books",
                icon: "book-open-page-variant-outline",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Milk",
                icon: "baby-bottle-outline",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Money Gift",
                icon: "cashMultiple",
                type: CategoryType.EXPENSE,
                editable: true
            }
        ]
    },
    {
        name: "Daily Needs",
        icon: "check_room",
        type: CategoryType.EXPENSE,
        editable: false,
        children: [
            {
                name: "Elictricity",
                icon: "lightbulb",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Phone",
                icon: "phone_android_outlined",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Gas",
                icon: "fire",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Internet",
                icon: "cell_wifi_outlined",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Water",
                icon: "water_drop",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Household",
                icon: "broom",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "TV",
                icon: "live_tv_outlined",
                type: CategoryType.EXPENSE,
                editable: true
            }
        ]
    },
    {
        name: "Transportation",
        icon: "directions_bike",
        type: CategoryType.EXPENSE,
        editable: false,
        children: [
            {
                name: "Public Transport",
                icon: "bus",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Parking",
                icon: "parking",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Fuel",
                icon: "local_gas_station",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Repair",
                icon: "toolbox",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Taxi",
                icon: "car",
                type: CategoryType.EXPENSE,
                editable: true
            }
        ]
    },
    {
        name: "Health",
        icon: "hospital-building",
        type: CategoryType.EXPENSE,
        editable: false,
        children: [
            {
                name: "Medicine",
                icon: "pill",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Doctor",
                icon: "stethoscope",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Sports",
                icon: "badminton",
                type: CategoryType.EXPENSE,
                editable: true
            }
        ]
    },
    {
        name: "Clothes",
        icon: "tshirt-crew",
        type: CategoryType.EXPENSE,
        editable: false,
        children: [
            {
                name: "Shoes",
                icon: "shoe-sneaker",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Accessories",
                icon: "watch",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Clothes",
                icon: "tshirt-crew",
                type: CategoryType.EXPENSE,
                editable: true
            }
        ]
    },
    {
        name: "Social & Gifts",
        icon: "flower",
        type: CategoryType.EXPENSE,
        editable: false,
        children: [
            {
                name: "Gift",
                icon: "gift",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Donation",
                icon: "heart-circle",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Party",
                icon: "groups",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Birthday",
                icon: "cake",
                type: CategoryType.EXPENSE,
                editable: true
            }
        ]
    },
    {
        name: "Lend",
        icon: "cash-minus",
        type: CategoryType.LEND,
        editable: false,
    },
    {
        name: "Borrow",
        icon: "cash-plus",
        type: CategoryType.LEND,
        editable: false,
    },
    {
        name: "Salary",
        icon: "salary",
        type: CategoryType.INCOME,
        editable: false
    },
    {
        name: "Investments",
        icon: "investment",
        type: CategoryType.INCOME,
        editable: false
    }
];