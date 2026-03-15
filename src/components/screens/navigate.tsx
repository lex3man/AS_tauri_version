'use client'

import { LeftMenu } from "../menus/left-menu"
import { RightMenu } from "../menus/right-menu"
import { Button } from "../ui/button"
import { Label } from "../ui/label"

const Ride = () => {
    return (
        <div className="flex flex-col gap-5 justify-center">
            <div className="flex justify-center gap-10 py-20">
                <LeftMenu />
                <Label htmlFor="check points">RIDE</Label>
                <RightMenu />
            </div>

            <div className="flex justify-center gap-10 py-20 relative z-10">
                <Button onClick={() => {}}>LANDSCAPE</Button>
                <Button onClick={() => {}}>PORTRAIT</Button>
            </div>
        </div>
    )
}

export default Ride