import React, { useState, useEffect, useRef } from 'react';
import Media from "../components/Media"
import style from "../pages/art.module.scss"
import gsap from "gsap"

const LightBox = ({ children, media }) => {
	const ref = useRef(null);
	const [isOpen, setIsOpen] = useState(false);

	const toggleIsOpen = () => {
		setIsOpen(!isOpen);
	};

	const useMousePosition = () => {
		const [position, setPosition] = useState({ x: 0, y: 0 });

		useEffect(() => {
			const setFromEvent = (e) => setPosition({ x: e.clientX, y: e.clientY });
			window.addEventListener("mousemove", setFromEvent);

			return () => {
				window.removeEventListener("mousemove", setFromEvent);
			};
		}, []);

		return position;
	};

	const position = useMousePosition();
	if (isOpen && ref.current) {
		gsap.to(ref.current, {y: (position.y-ref.current.clientHeight/2)*-1});
	}

	return (
		<div onClick={toggleIsOpen}>
			{children}
			{isOpen ?
				<div onClick={toggleIsOpen} className={style.lightbox}>
					<div className={style.lightbox__inner}>
						<div ref={ref}><Media media={media} /></div>
						<div className={style.caption}>{media.title}</div>
					</div>
				</div>
				: null}
		</div>
	);
};

export default LightBox;