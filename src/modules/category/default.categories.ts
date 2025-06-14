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
        name: "Ăn uống",
        icon: "fastfood",
        type: CategoryType.EXPENSE,
        editable: true,
        children: [
            {
                name: "Ăn tiệm",
                icon: "receipt",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Ăn tối",
                icon: "food-turkey",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Ăn vặt",
                icon: "hamburger",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Cà phê",
                icon: "local_cafe",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Bia rượu",
                icon: "local_bar_sharp",
                type: CategoryType.EXPENSE,
                editable: true
            }
        ]
    },
    {
        name: "Con cái",
        icon: 'groups',
        type: CategoryType.EXPENSE,
        editable: true,
        children: [
            {
                name: "Học tập",
                icon: "school",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Đồ chơi",
                icon: "gamepad-variant",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Sách vở",
                icon: "book-open-page-variant-outline",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Sữa",
                icon: "baby-bottle-outline",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Tiền tiêu vặt",
                icon: "cashMultiple",
                type: CategoryType.EXPENSE,
                editable: true
            }
        ]
    },
    {
        name: "Dịch vụ sinh hoạt",
        icon: "check_room",
        type: CategoryType.EXPENSE,
        editable: true,
        children: [
            {
                name: "Tiền điện",
                icon: "lightbulb",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Điện thoại",
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
                name: "Tiền nước",
                icon: "water_drop",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Vệ sinh",
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
        name: "Đi lại",
        icon: "directions_bike",
        type: CategoryType.EXPENSE,
        editable: true,
        children: [
            {
                name: "Phương tiện công cộng",
                icon: "bus",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Gửi xe",
                icon: "parking",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Xăng xe",
                icon: "local_gas_station",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Sửa chữa, bảo dưỡng",
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
        name: "Sức khỏe",
        icon: "hospital-building",
        type: CategoryType.EXPENSE,
        editable: true,
        children: [
            {
                name: "Tiền thuốc",
                icon: "pill",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Khám, chữa bệnh",
                icon: "stethoscope",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Thể thao",
                icon: "badminton",
                type: CategoryType.EXPENSE,
                editable: true
            }
        ]
    },
    {
        name: "Trang phục",
        icon: "tshirt-crew",
        type: CategoryType.EXPENSE,
        editable: true,
        children: [
            {
                name: "Giầy dép",
                icon: "shoe-sneaker",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Phụ kiện",
                icon: "watch",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Quần áo",
                icon: "tshirt-crew",
                type: CategoryType.EXPENSE,
                editable: true
            }
        ]
    },
    {
        name: "Hiếu hỉ",
        icon: "flower",
        type: CategoryType.EXPENSE,
        editable: true,
        children: [
            {
                name: "Quà tặng",
                icon: "gift",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Từ thiện",
                icon: "heart-circle",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Tiệc tùng",
                icon: "groups",
                type: CategoryType.EXPENSE,
                editable: true
            },
            {
                name: "Sinh nhật",
                icon: "cake",
                type: CategoryType.EXPENSE,
                editable: true
            }
        ]
    },
    {
        name: "Khác",
        icon: "default",
        type: CategoryType.EXPENSE,
        editable: false,
    },
    {
        name: "Cho vay",
        icon: "cash-minus",
        type: CategoryType.LEND,
        editable: false,
    },
    {
        name: "Đi vay",
        icon: "cash-plus",
        type: CategoryType.BORROW,
        editable: false,
    },
    {
        name: "Thu nợ",
        icon: "cash-plus",
        type: CategoryType.COLLECTING_DEBT,
        editable: false,
    },
    {
        name: "Trả nợ",
        icon: "cash-minus",
        type: CategoryType.REPAYMENT,
        editable: false,
    },
    {
        name: "Lương",
        icon: "cashMultiple",
        type: CategoryType.INCOME,
        editable: false
    },
    {
        name: "Tiền lãi",
        icon: "trending_up",
        type: CategoryType.INCOME,
        editable: true
    },
    {
        name: "Khác",
        icon: "default",
        type: CategoryType.INCOME,
        editable: false
    }
];