import { Module } from "@nestjs/common";
import { RelatedUserController } from "./related-user.controller";
import { RelatedUserService } from "./related-user.service";

@Module({
    controllers: [RelatedUserController],
    providers: [RelatedUserService],
    exports: [RelatedUserService]
})
export class RelatedUserModule {}