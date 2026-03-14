import { Button } from "@/components/ui/button"
import { useState } from "react"

interface Props {
    typeOfData: "race number" | "command" | "code of a day"
    setAnswer: (data: string) => void;
}

export const DataRequest = (props: Props) => {
    const [userInput, setUserInput] = useState("")

    return(
        <div className="conainer m-auto gap-10">
            <div className="flex gap-5 m-auto p-10">
                <input className="border-b-2 w-auto" value={userInput.toUpperCase()} onChange={(e) => setUserInput(e.target.value)} autoFocus></input>
                <Button size={'lg'} onClick={() => props.setAnswer(userInput.toUpperCase())}>SUBMIT</Button>
            </div>
            <div className="text-4xl">{props.typeOfData.toUpperCase()}</div>
        </div>
    )
}