import styled from 'styled-components';
import React from "react";

export function Separator(props: { text: string, display: boolean }) {
    return (
        <>
            {props.display && <StyledSeparator>
                <Line />
                <Text>{props.text}</Text>
                <Line />
            </StyledSeparator>}
        </>
    );
}

const StyledSeparator = styled.div`
    display: flex;
    align-items: center;
    text-align: center;
    color: gray;
    margin: 2px 10px;
    position: relative;
`;

const Line = styled.hr`
    flex: 1;
    border: none;
    border-top: 1px solid #ccc;
`;

const Text = styled.span`
    font-size: 12px;
    padding: 0 5px;
    position: absolute;
    left: 5%;
    background: white;
    z-index: 0;
`;