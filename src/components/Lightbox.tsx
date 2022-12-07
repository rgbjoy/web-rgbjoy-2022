import React, { useState } from 'react';
import Image from 'next/legacy/image'
import style from "../pages/art.module.scss"

const LightBox = ({ children, image }) => {
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
						<Image
							src={image.sourceUrl}
							width={image.mediaDetails.width}
							height={image.mediaDetails.height}
							alt=""
							placeholder="blur"
							blurDataURL={image.mediaDetails.sizes[0].sourceUrl}
							quality={100}
						/>
					</div>
				</div>
				: null}
		</div>
	);
};

export default LightBox;