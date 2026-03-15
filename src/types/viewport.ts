import { TypeOfRequest } from "./request"

export class ViewPort {
    constructor(
        public name: string,
        private active: boolean,
        public type?: TypeOfRequest,
    ) {}

    activate() {
        this.active = true
    }

    deactivate() {
        this.active = false
    }

    isActive(): boolean {
        return this.active
    }

    static new(name: string, type?: TypeOfRequest): ViewPort {
        return new ViewPort(name, false, type)
    }
}