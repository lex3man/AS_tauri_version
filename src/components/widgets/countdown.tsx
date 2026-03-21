import { useAppState } from "@/ctx/state-provider"

const CountdownWidget = () => {
    const { dashBoard } = useAppState()

    return (
        <div className="flex flex-col justify-center gap-2 border-2 border-primary">
            <div className="m-auto p-5">TIME</div>
            <div className="text-6xl m-auto pb-5">{dashBoard.metrics.total}</div>
        </div>
    )
}

export default CountdownWidget;