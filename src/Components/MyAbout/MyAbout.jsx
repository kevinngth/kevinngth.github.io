import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import './MyAbout.scss';

function MyAbout() {
    return (
        <div className="diagonal-box">
            <Row className="p-0">
                <Col className="d-none d-md-block"></Col>
                <Col className="text-center text-white m-2 p-2 upper-box" >
                    <h1 className="font-weight-bold">Full-Stack <br/> Software Engineer</h1>
                </Col>
            </Row>
            <Row>
                <Col className="text-center text-white m-2 p-4 lower-box" >
                    <h5 className="text-justify">
                        I'm Kevin, a software engineer based in Singapore. Click on the images to view my stack and portfolio.
                    </h5>
                </Col>
                <Col className="m-3 d-none d-md-block"></Col>
            </Row>
        </div>
    );
}

export default MyAbout;