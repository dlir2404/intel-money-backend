import {ApiProperty} from "@nestjs/swagger";
import {IsArray, IsDefined, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString} from "class-validator";
import {Category, Wallet} from "../../database/models";
import {CategoryType} from "../../shared/enums/category";

export class GetNotSyncDataRequest {
    @ApiProperty({
        description: "The time of the last sync on client, in UTC ISO8601 format",
        example: "2025-05-21T12:00:00Z"
    })
    @IsString()
    @IsNotEmpty()
    lastSyncTime: string;
}

export class SyncData<T> {
    @ApiProperty({
        description: 'Created items',
        isArray: true
    })
    create: T[];

    @ApiProperty({
        description: 'Updated items',
        isArray: true
    })
    update: T[];

    @ApiProperty({
        description: 'Deleted items',
        isArray: true
    })
    delete: T[];
}

export class CategoryData {
    @ApiProperty({
        description: 'Category name',
        example: 'Food'
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Category icon',
        example: 'food-icon.png'
    })
    @IsString()
    @IsNotEmpty()
    icon: string;

    @ApiProperty({
        enum: CategoryType,
        example: CategoryType.EXPENSE
    })
    @IsString()
    @IsNotEmpty()
    type: CategoryType;

    @ApiProperty({
        description: 'Is the category editable',
        example: true
    })
    @IsOptional()
    editable: boolean;

    @ApiProperty({
        description: 'Parent category ID',
        required: false,
        example: null
    })
    @IsOptional()
    @IsNumber()
    parentId: number;

    @ApiProperty()
    @IsNumber()
    @IsDefined()
    userId: number;

    @ApiProperty()
    @IsISO8601()
    createdAt: string;

    @ApiProperty()
    @IsISO8601()
    updatedAt: string;
}

export class CategoryCreateData extends CategoryData{
    @ApiProperty({
        description: 'Temperature category in the client, we will use this to reupdate in the client',
        example: '1132112414'
    })
    @IsString()
    @IsNotEmpty()
    tempId: string;
}

export class CategoryUpdateData extends CategoryData{
    @ApiProperty({
        description: 'We need this id to determine which category to update',
        example: 1
    })
    @IsNumber()
    @IsDefined()
    id: number;
}

export class CategorySyncData {
    @ApiProperty({
        type: [CategoryCreateData],
        description: 'List of categories need to create',
    })
    @IsArray()
    create: CategoryCreateData[];

    @ApiProperty({
        type: [CategoryUpdateData],
        description: 'List of categories need to update',
    })
    @IsArray()
    update: CategoryUpdateData[];

    @ApiProperty({
        type: [Number],
        description: 'List of categories need to delete',
    })
    @IsArray()
    @IsNumber({}, { each: true })
    delete: number[];
}

export class WalletData {
    @ApiProperty({
        description: 'Wallet name',
        example: 'My Wallet'
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Wallet description',
        example: 'This is my wallet'
    })
    @IsString()
    @IsOptional()
    description: string;

    @ApiProperty({
        description: 'Wallet icon',
        example: 'wallet-icon.png'
    })
    @IsString()
    @IsNotEmpty()
    icon: string;

    @ApiProperty({
        description: 'Wallet balance',
        example: 1000
    })
    @IsNumber()
    @IsDefined()
    balance: number;

    @ApiProperty()
    @IsNumber()
    @IsDefined()
    userId: number;

    @ApiProperty()
    @IsISO8601()
    createdAt: string;

    @ApiProperty()
    @IsISO8601()
    updatedAt: string;
}

export class WalletCreateData extends WalletData{
    @ApiProperty({
        description: 'Temperature wallet in the client, we will use this to reupdate in the client',
        example: '1132112414'
    })
    @IsString()
    @IsNotEmpty()
    tempId: string;
}

export class WalletUpdateData extends WalletData{
    @ApiProperty({
        description: 'We need this id to determine which wallet to update',
        example: 1
    })
    @IsNumber()
    @IsDefined()
    id: number;
}

export class WalletSyncData {
    @ApiProperty({
        type: [WalletCreateData],
        description: 'List of wallets need to create',
    })
    @IsArray()
    create: WalletCreateData[];

    @ApiProperty({
        type: [WalletUpdateData],
        description: 'List of wallets need to update',
    })
    @IsArray()
    update: WalletUpdateData[];

    @ApiProperty({
        type: [Number],
        description: 'List of wallets need to delete',
    })
    @IsArray()
    @IsNumber({}, { each: true })
    delete: number[];
}

export class RelatedUserData {
    @ApiProperty({
        description: 'Related user name',
        example: 'John Doe'
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Related user phone',
        example: '+1234567890'
    })
    @IsString()
    @IsOptional()
    phone: string;

    @ApiProperty({
        description: 'Related user email',
        example: 'example@gmail.com'
    })
    @IsString()
    @IsOptional()
    email: string;

    @ApiProperty()
    @IsNumber()
    @IsDefined()
    userId: number;

    @ApiProperty({
        description: 'Related user total loan',
        example: 1000
    })
    @IsNumber()
    @IsDefined()
    totalLoan: number;

    @ApiProperty({
        description: 'Related user total paid',
        example: 500
    })
    @IsNumber()
    @IsDefined()
    totalPaid: number;

    @ApiProperty({
        description: 'Related user total debt',
        example: 200
    })
    @IsNumber()
    @IsDefined()
    totalDebt: number;

    @ApiProperty({
        description: 'Related user total collected',
        example: 300
    })
    @IsNumber()
    @IsDefined()
    totalCollected: number;
}

export class RelatedUserCreateData extends RelatedUserData{
    @ApiProperty({
        description: 'Temperature related user in the client, we will use this to reupdate in the client',
        example: '1132112414'
    })
    @IsString()
    @IsNotEmpty()
    tempId: string;
}

export class RelatedUserUpdateData extends RelatedUserData{
    @ApiProperty({
        description: 'We need this id to determine which related user to update',
        example: 1
    })
    @IsNumber()
    @IsDefined()
    id: number;
}

export class RelatedUserSyncData {
    @ApiProperty({
        type: [RelatedUserCreateData],
        description: 'List of related users need to create',
    })
    @IsArray()
    create: RelatedUserCreateData[];

    @ApiProperty({
        type: [RelatedUserUpdateData],
        description: 'List of related users need to update',
    })
    @IsArray()
    update: RelatedUserUpdateData[];

    @ApiProperty({
        type: [Number],
        description: 'List of related users need to delete',
    })
    @IsArray()
    @IsNumber({}, { each: true })
    delete: number[];
}

export class SyncRequest {
    @ApiProperty({
        description: 'Category synchronization data',
        type: CategorySyncData
    })
    @IsDefined()
    categories: CategorySyncData;

    @ApiProperty({
        description: 'Wallet synchronization data',
        type: WalletSyncData
    })
    @IsDefined()
    wallets: WalletSyncData;

    @ApiProperty({
        description: 'Related user synchronization data',
        type: RelatedUserSyncData
    })
    @IsDefined()
    relatedUsers: RelatedUserSyncData;
}