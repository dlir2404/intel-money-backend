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
        icon: "food",
        type: CategoryType.EXPENSE,
        editable: false,
        children: [
            {
                name: "Restaurant",
                icon: "bills",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Groceries",
                icon: "shopping",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Snacks",
                icon: "food",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Beverages",
                icon: "category",
                type: CategoryType.EXPENSE,
                editable: true
            }
        ]
    },
    {
        name: "Transportation",
        icon: "transport",
        type: CategoryType.EXPENSE,
        editable: false,
        children: [
            {
                name: "Public Transport",
                icon: "transport",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Fuel",
                icon: "transport",
                type: CategoryType.EXPENSE,
                editable: true
            }
        ]
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