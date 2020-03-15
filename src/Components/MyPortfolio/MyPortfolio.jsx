import React, { useState } from "react";
import "./MyPortfolio.scss";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Button from 'react-bootstrap/Button';
import Image from "react-bootstrap/Image";
import PORTFOLIO from "./portfolio";

function MyPortfolio() {
    const [portfolio, setPortfolio] = useState(PORTFOLIO);
    const slideProjects = direction => {
        let item;
        switch (direction) {
            case "upward":
                item = portfolio.pop();
                setPortfolio([item, ...portfolio]);
                break;
            case "downward":
                item = portfolio.shift();
                setPortfolio([...portfolio, item]);
                break;
            default:
                console.log("Something went wrong");
        }
    };
    return (
        <Row>
            <Col md={6} className="d-flex flex-column justify-content-center align-items-center">
                <Row className="slide-top" onClick={() => slideProjects("upward")}>
                    <Image src={portfolio[0].img_src} fluid />
                </Row>
                <Row className="slide-mid">
                    <div className="d-md-none" style={{ zIndex: "3", transform: "translate(-100%,61px)"}}>
                        <ButtonGroup size='sm' vertical="true" aria-label="Basic example">
                            <Button href={portfolio[1].app_link} variant='info'>App</Button>
                            <Button href={portfolio[1].repo_link} variant='info'>Repo</Button>
                        </ButtonGroup>
                    </div>
                    <Image style={{ zIndex: "2" }} src={portfolio[1].img_src} fluid/>
                </Row>
                <Row className="slide-bottom" onClick={() => slideProjects("downward")}>
                    <Image src={portfolio[2].img_src} fluid />
                </Row>
            </Col>
            <Col className="d-md-flex justify-content-center align-items-center description">
                <div>
                    <h3>{portfolio[1].title}</h3>
                    <p>{portfolio[1].text}</p>
                    <ButtonGroup aria-label="Basic example">
                        <Button href={portfolio[1].app_link} variant='info'>App</Button>
                        <Button href={portfolio[1].repo_link} variant='info'>Repo</Button>
                    </ButtonGroup>
                </div>
            </Col>
        </Row>
    );
}

export default MyPortfolio;