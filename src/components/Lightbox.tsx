import React, { useState } from 'react';
import Image from 'next/image'
import style from "../pages/doodles.module.scss"

const LightBox = ({ children, src, alt, Wrapper = 'div', zIndex = 100 }) => {
	const [isOpen, setIsOpen] = useState(false);

	const toggleIsOpen = () => {
		setIsOpen(!isOpen);
	};

	return (
		<div onClick={toggleIsOpen}>
			{children}
			{isOpen ?
				<div onClick={toggleIsOpen} className={style.lightbox}>
					<img src={src} alt={alt} />
				</div>
				: null}
		</div>
	);
};

export default LightBox;