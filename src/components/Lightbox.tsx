import React, { useState, useEffect, useRef } from 'react';
import Media from "../components/Media"
import style from "../pages/art.module.scss"
import gsap from "gsap"

const LightBox = ({ children, media }) => {
	const ref = useRef(null);
	const [isOpen, setIsOpen] = useState(false);

	const toggleIsOpen = () => {
		setIsOpen(!isOpen);
		if (!isOpen) {
			document.getElementById("footer").classList.add("hidden")
		} else {
			document.getElementById("footer").classList.remove("hidden")
		}

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

	let position = useMousePosition();
	if (isOpen && ref.current) {
		let posY = position.y - ref.current.offsetHeight /2
		gsap.to(ref.current, {y: -posY} );
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