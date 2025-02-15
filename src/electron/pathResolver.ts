import { app } from "electron"
import path from "path"

export function getPreloadPath() {
    return path.join(app.getAppPath(), "/dist-electron/preload.cjs")
}

export function getAssetPath(...paths: string[]) {
    return path.join(app.getAppPath(), "/src/assets**", ...paths)
}

export function getUIPath() {
    return path.join(app.getAppPath(), '/dist-react/index.html')
}