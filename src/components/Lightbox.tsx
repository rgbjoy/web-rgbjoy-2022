import React, { useState } from 'react';
import Media from "../components/Media"
import style from "../pages/art.module.scss"

const LightBox = ({ children, media }) => {
	const [isOpen, setIsOpen] = useState(false);

	const toggleIsOpen = () => {
		setIsOpen(!isOpen);
	};

	return (
		<div onClick={toggleIsOpen}>
			{children}
			{isOpen ?
				<div onClick={toggleIsOpen} className={style.lightbox}>
					<div className={style.lightbox__inner}>
						<Media media={media} />
						<div className={style.caption}>{media.title}</div>
					</div>
				</div>
				: null}
		</div>
	);
};

export default LightBox;