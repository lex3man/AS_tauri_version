import { TypeOfRequest } from "./types/request";
import { ViewPort } from "./types/viewport";

class Viewports {
    constructor (private map: Map<string, ViewPort> = new Map()) {
        map.set('request', ViewPort.new('request'))
        map.set('navigate', ViewPort.new('navigate'))
        map.set('tracking', ViewPort.new('tracking'))
        map.set('total', ViewPort.new('total'))
        map.set('settings', ViewPort.new('settings'))
        map.set('checkpoints', ViewPort.new('checkpoints'))
        map.set('admin-area', ViewPort.new('admin-area'))
    }

    activate(name: string, type?: TypeOfRequest) {
        if (type) {
            this.map.set('request', ViewPort.new('request', type))
        }
        this.map.forEach((screen) => screen.deactivate)
        this.map.get(name)?.activate
    }

    getActive(): string {
        this.map.forEach((s) => {
            if (s.isActive()) return s.name
        })
        return "navigate"
    }
}

export default Viewports