import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { TransactionType } from "src/shared/enums/transaction";
import { CompactCategoryResponse } from "../category/category.dto";
import { CompactWalletResponse } from "../wallet/wallet.dto";
import { Expose, Type } from "class-transformer";

export class CreateGeneralTransactionRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;
  
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    required: false
  })
  @IsString()
  @IsOptional()
  transactionDate?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  sourceWalletId: number;

  @ApiProperty({
    required: false
  })
  @IsBoolean()
  @IsOptional()
  notAddToReport?: boolean;

  @ApiProperty({
    required: false
  })
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

@Expose()
export class GeneralTransactionResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  type: TransactionType;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  categoryId: number;

  @ApiProperty({
    type: CompactCategoryResponse
  })
  @Type(() => CompactCategoryResponse)
  category: any;

  @ApiProperty()
  description: string;

  @ApiProperty()
  transactionDate: string;

  @ApiProperty()
  sourceWalletId: number;

  @ApiProperty({
    type: CompactWalletResponse
  })
  @Type(() => CompactWalletResponse)
  sourceWallet: any;

  @ApiProperty()
  notAddToReport: boolean;

  @ApiProperty()
  images: string[];

  constructor(partial: Partial<GeneralTransactionResponse>) {
    Object.assign(this, partial);
  }
}

export class CreateTransferTransactionRequest {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    required: false
  })
  @IsString()
  @IsOptional()
  transactionDate?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  sourceWalletId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  destinationWalletId: number;

  @ApiProperty({
    required: false
  })
  @IsBoolean()
  @IsOptional()
  notAddToReport?: boolean;

  @ApiProperty({
    required: false
  })
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

@Expose()
export class TransferTransactionResponse extends GeneralTransactionResponse {
  @ApiProperty()
  destinationWalletId: number;

  @ApiProperty({
    type: CompactWalletResponse
  })
  @Type(() => CompactWalletResponse)
  destinationWallet: any;

  constructor(partial: Partial<TransferTransactionResponse>) {
    super(partial);
  }
}