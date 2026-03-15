'use client'

import { useAppState } from "@/ctx/state-provider"
import { Button } from "../ui/button"
import { SetValues } from "./admin-panel/test-values"

const AdminPanel = () => {
    const { callView } = useAppState()

    return (
        <div className="flex justify-center pt-28 gap-10">
            <SetValues />
            <Button onClick={() => callView('checkpoints')}>Check Points</Button>
        </div>
    )
}

export default AdminPanel