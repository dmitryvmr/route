import React from "react"

// Component
import PropTypes from "prop-types"
import styled from "styled-components"

// CSS
import '../css/map.css'

// Styled component container
const Container = styled.div`
    progress[value] {
        width: ${props => props.width}
        appearance: none

        ::-webkit-progress-bar {
            height: 10px;
            border-radius: 20px;
            background-color: #EEE;
        }

        ::-webkit-progress-value {
            height: 10px;
            border-radius: 20px;
            background-color: ${props => props.color};
        }
    }
`

// PROGRESS BAR COMPONENT
const ProgressBar = props => {

  const { value, max, color, width } = props

    return (
        <Container color={color} width={width}>
            <progress value={value} max={max} />
            <span>{(value / max) * 100}%</span>
        </Container>
    )
}

ProgressBar.propTypes = {
    value: PropTypes.number.isRequired,
    max: PropTypes.number,
    color: PropTypes.string,
    width: PropTypes.string
}

ProgressBar.defaultProps = {
    max: 100,
    color: "FF7979",
    width: "150px"
}

export default ProgressBar;