import React, { useState, useEffect, useRef } from 'react';
import Media from "../components/Media"
import style from "../pages/art.module.scss"
import gsap from "gsap"
import useWindowDimensions from '../utils/useWindowDimensions'

const LightBox = ({ children, media }) => {
	const ref = useRef(null);
	const [isOpen, setIsOpen] = useState(false);

	const toggleIsOpen = () => {
		setIsOpen(!isOpen);
		if (!isOpen) {
			document.querySelector("body").classList.add("noscroll")
			document.querySelector("#header").classList.add("hidden")
			document.querySelector("#footer").classList.add("hidden")
		} else {
			document.querySelector("body").classList.remove("noscroll")
			document.querySelector("#header").classList.remove("hidden")
			document.querySelector("#footer").classList.remove("hidden")
		}

	};

	const useMousePosition = () => {
		const [position, setPosition] = useState({ x: 0, y: 0 });

		useEffect(() => {
			const setFromMouseEvent = (e) => setPosition({ x: e.clientX, y: e.clientY });
			window.addEventListener("mousemove", setFromMouseEvent);

			return () => {
				window.removeEventListener("mousemove", setFromMouseEvent);
			};
		}, []);

		return position;
	};

	let position = useMousePosition();
	const { width } = useWindowDimensions();
	if (isOpen && ref.current) {
		if (width > 800) {
			let posY = position.y - ref.current.offsetHeight /2
			gsap.to(ref.current, {y: -posY} );
		}
	}

	return (
		<div onClick={toggleIsOpen}>
			{children}
			{isOpen ?
				<div onClick={toggleIsOpen} className={style.lightbox}>
					<div className={style.lightbox__inner}>
						<div className={style.lightbox_wrapper} ref={ref}><Media media={media} /></div>
						<div className={style.caption}>{media.title}</div>
					</div>
				</div>
				: null}
		</div>
	);
};

export default LightBox;