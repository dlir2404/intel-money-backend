import {Module} from "@nestjs/common";
import {SyncService} from "./synce.service";
import {SyncController} from "./sync.controller";
import {AppCacheModule} from "../cache/cache.module";

@Module({
    imports: [AppCacheModule],
    controllers: [SyncController],
    providers: [SyncService],
    exports: []
})
export class SyncModule {
}