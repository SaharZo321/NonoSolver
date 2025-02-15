import { Box, Button, List, ListItem, SliderProps, Typography, } from "@mui/material";

import Board from "@board-utils/board";
import { PropsWithChildren, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import styled from "@emotion/styled";
import { useDebouncedCallback } from "use-debounce";
import { Flip, RotateLeftRounded, RotateRightRounded } from "@mui/icons-material";
import { BoardContainerPage } from "@components/Board/PageLayout";
import { useNavigate } from "react-router-dom";
import { StyledButton, StyledSlider } from "@components/General/StyledComponents";
import { SettingsContext } from "@renderer/App";
import { Mark } from "@mui/material/Slider/useSlider.types";
import ConstraintDialog from "./ConstraintDialog";

const defaultSize = 10
const demoBoard = new Board({ size: defaultSize })

type BoardReducerActions = {
    type: 'randomize',
    markingChance?: number,
} | {
    type: 'reset-board',
} | {
    type: 'change-size',
    size: number,
} | {
    type: 'rotate-right',
} | {
    type: 'rotate-left',
} | {
    type: 'flip-vertically',
} | {
    type: 'flip-horizontally',
} | {
    type: 'set-tile',
    tile: {
        position: Position,
        state: BoardTile,
    }
} | {
    type: 'flip-tile',
    tile: {
        position: Position,
    }
}

const boardReducer = (state: Board, action: BoardReducerActions) => {
    switch (action.type) {
        case "randomize":
            const clone = state.clone.randomize(action.markingChance ? action.markingChance : 0.5);
            return clone
        case "reset-board":
            return new Board({ size: state.size });
        case "change-size":
            return new Board({ size: action.size ? action.size : 10 });
        case "rotate-right":
            return state.clone.rotateClockwise();
        case "rotate-left":
            return state.clone.rotateCounterClockwise();
        case "flip-vertically":
            return state.clone.flipVertically()
        case "flip-horizontally":
            return state.clone.flipHorizontally()
        case "set-tile":
            return state.clone.setTile(action.tile.position, action.tile.state).generateTileConstraints(action.tile.position);
        case "flip-tile":
            const tileState = state.getTile(action.tile.position);
            return state.clone.setTile(action.tile.position,
                tileState === "marked" ? "unmarked" : "marked")
                .generateTileConstraints(action.tile.position);
        default:
            console.error("invalid action type");
            return state;
    }
}

const DEFAULT_CHANCE = 0.5
export default function BoardCreation() {
    const { hoverColor, tileColor } = useContext(SettingsContext)
    const [board, dispatchBoard] = useReducer(boardReducer, demoBoard)
    const [randomMarkingChance, setMarkingChance] = useState(DEFAULT_CHANCE)
    const [clickedConstraint, setClickedConstraint] = useState<{ type: "row" | "column", index: number }>()

    useEffect(() => {
        dispatchBoard({ type: "reset-board" })
    }, [])

    const navigate = useNavigate()

    const handleBoardSizeChange = useDebouncedCallback<NonNullable<SliderProps["onChange"]>>((_, value) => {
        dispatchBoard({ type: 'change-size', size: value as number })
    }, 100)

    const handleMarkingChanceChange = useCallback((chance: number) => {
        setMarkingChance(chance)
    }, [])

    const handleFlipVertically = useCallback(() => {
        dispatchBoard({ type: 'flip-vertically' })
    }, [])

    const handleFlipHorizontally = useCallback(() => {
        dispatchBoard({ type: 'flip-horizontally' })
    }, [])

    const handleRotateLeft = useCallback(() => {
        dispatchBoard({ type: 'rotate-left' })
    }, [])

    const handleRotateRight = useCallback(() => {
        dispatchBoard({ type: 'rotate-right' })
    }, [])

    const handleResetBoard = useCallback(() => {
        dispatchBoard({ type: 'reset-board' })
    }, [])

    const setTile = useCallback((position: Position, state: BoardTile) => {
        dispatchBoard({ type: 'set-tile', tile: { position, state } })
    }, [])

    const handleShowSolution = useCallback(() => {
        if (board.isBoardEmpty) {
            alert('Cannot solve an empty board!')
        } else {
            navigate('/board-solutions', {
                state: board
            })
            dispatchBoard({ type: "reset-board" })
        }
    }, [board])

    const randomizeBoard = useCallback(() => {
        dispatchBoard({ type: 'randomize', markingChance: randomMarkingChance })
    }, [randomMarkingChance])

    const initialConstraint = useMemo(() => (
        !clickedConstraint ? [] : board.constraints[`${clickedConstraint.type}s`][clickedConstraint.index]
    ), [clickedConstraint, board])

    const handleConstraintDialogSave = (constraint: LineConstraint) => {
        if (!clickedConstraint) {
            return
        }
        board.constraints[`${clickedConstraint.type}s`][clickedConstraint.index] = constraint
    }

    return (

        <BoardContainerPage
            board={board}
            interactable
            setTile={setTile}
            hoverColor={hoverColor}
            tileColor={tileColor}
            sizeVMin={60}
            onConstraintClick={setClickedConstraint}
        >
            <List>
                <BoardUtilsItem text="Board Size">
                    <StyledSlider
                        min={5}
                        max={20}
                        step={1}
                        marks={marks}
                        track={false}
                        defaultValue={defaultSize}
                        valueLabelDisplay='auto'
                        onChange={handleBoardSizeChange}
                    />
                </BoardUtilsItem>
                <BoardUtilsItem>
                    <RandomizingUtility
                        onClick={randomizeBoard}
                        onSliderChange={handleMarkingChanceChange}
                        defaultChance={DEFAULT_CHANCE}
                    />
                </BoardUtilsItem>
                <BoardUtilsItem>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        flexDirection: 'row',

                    }}>
                        <StyledButton variant="contained" onClick={handleRotateLeft}>
                            <RotateLeftRounded fontSize='large' />
                        </StyledButton>
                        <StyledButton variant="contained" onClick={handleRotateRight}>
                            <RotateRightRounded fontSize='large' />
                        </StyledButton>
                        <StyledButton variant="contained" onClick={handleFlipHorizontally}>
                            <Flip fontSize='large' />
                        </StyledButton>
                        <StyledButton variant="contained" onClick={handleFlipVertically}>
                            <Flip fontSize='large' sx={{ transform: 'rotate(90deg)' }} />
                        </StyledButton>
                    </Box>
                </BoardUtilsItem>
                <BoardUtilsItem>
                    <Button variant="contained" size='large' sx={{ fontWeight: 'bold', width: '100%' }}
                        onClick={handleResetBoard}
                    >
                        RESET BOARD
                    </Button>
                </BoardUtilsItem>
                <BoardUtilsItem>
                    <Button
                        variant="contained"
                        size='large'
                        sx={{ fontWeight: 'bold', width: '100%' }}
                        onClick={handleShowSolution}
                    >
                        SHOW ME THE SOLUTION
                    </Button>
                </BoardUtilsItem>

            </List>
            <ConstraintDialog
                open={!!clickedConstraint}
                index={clickedConstraint?.index}
                type={clickedConstraint?.type}
                onSave={handleConstraintDialogSave}
                onClose={() => setClickedConstraint(undefined)}
                initialConstraint={initialConstraint}
                maxSize={board.size}
            />
        </BoardContainerPage>
    )
}

type RandomizingUtilityProps = {
    defaultChance: number
    onClick: () => void,
    onSliderChange: (number: number) => void
}
const RandomizingUtility = (props: RandomizingUtilityProps) => {

    const [chance, setChance] = useState(props.defaultChance)

    const handleSliderChange = useCallback((value: number) => {
        setChance(value as number)
        props.onSliderChange(value as number)
    }, [props.onSliderChange])


    return (
        <Box sx={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center' }}>
            <Button variant="contained" onClick={props.onClick} size='large' sx={{ fontWeight: 'bold' }}>
                RANDOMIZE
            </Button>
            <Typography sx={{ flexBasis: '42px', textAlign: 'center' }}>
                {`${Math.round(chance * 100)}%`}
            </Typography>
            <Box display='flex' flexDirection='column' alignItems='center' flexGrow={2}>
                <Typography>
                    Chance
                </Typography>
                <StyledSlider
                    min={0.01}
                    max={1}
                    step={0.01}
                    track={false}
                    defaultValue={props.defaultChance}
                    onChange={(_, value) => handleSliderChange(value as number)}
                />
            </Box>
        </Box>
    )
}





type BoardUtilsItemProps = PropsWithChildren<{
    text?: string,

}>

const BoardUtilsItem = (props: BoardUtilsItemProps) => {
    return (
        <StyledListItem>
            {
                props.text &&
                <Typography variant="h6" fontWeight='bold'>
                    {props.text}
                </Typography>
            }
            {props.children}
        </StyledListItem>
    )
}

const StyledListItem = styled(ListItem)`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 300px;
    padding: 20px 0;
`

const marks: Mark[] = [
    {
        value: 5,
        label: '5x5',
    },
    {
        value: 10,
        label: '10x10',
    },
    {
        value: 15,
        label: '15x15',
    },
    {
        value: 20,
        label: '20x20',
    },
];
