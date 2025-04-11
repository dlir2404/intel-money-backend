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
        icon: "🍽️",
        type: CategoryType.EXPENSE,
        editable: false,
        children: [
            {
                name: "Restaurant",
                icon: "🍲",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Groceries",
                icon: "🛒",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Snacks",
                icon: "🍿",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Beverages",
                icon: "🍹",
                type: CategoryType.EXPENSE,
                editable: true
            }
        ]
    },
    {
        name: "Transportation",
        icon: "🚗",
        type: CategoryType.EXPENSE,
        editable: false,
        children: [
            {
                name: "Public Transport",
                icon: "🚌",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Fuel",
                icon: "⛽",
                type: CategoryType.EXPENSE,
                editable: true
            }
        ]
    },
    {
        name: "Salary",
        icon: "💵",
        type: CategoryType.INCOME,
        editable: false
    },
    {
        name: "Investments",
        icon: "📈",
        type: CategoryType.INCOME,
        editable: false
    }
];