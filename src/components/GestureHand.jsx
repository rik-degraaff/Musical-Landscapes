import React from 'react';

/** Authored silhouettes keep the fingertip and wrist clear at compact sizes. */
export function GestureHand({pose='point',className=''}) {
  return <svg className={`gesture-hand hand-${pose} ${className}`} viewBox="0 0 90 95" aria-hidden="true" focusable="false">
    {pose==='pressed'?<>
      <path d="M74 88 39 69Q31 66 27 60L8 32Q3 24 9 20Q15 16 21 23L29 32 24 17Q21 9 28 7Q34 6 37 14L46 36Q45 28 51 27Q57 26 60 35L63 42Q64 36 70 39Q75 41 76 50L79 57Q88 57 88 66L86 77Z"/>
      <path className="hand-crease" d="M30 33 38 48M46 37 49 48M63 44 65 53M41 63Q57 55 69 66M64 81 77 70"/>
      <path className="hand-contact" d="M21 11Q26 3 35 8"/>
    </>:pose==='grip'?<>
      <path d="M26 85 13 58Q9 48 16 45Q22 43 29 54L26 33Q25 24 32 23Q39 22 40 31L42 44 40 24Q40 16 47 16Q54 16 55 24L57 44 58 30Q59 22 66 23Q73 24 72 33L72 52Q82 45 85 52Q88 60 76 73L66 86Z"/>
      <path className="hand-crease" d="M32 61Q48 52 65 61M41 45 42 54M57 45 57 54M34 78 58 78"/>
    </>:pose==='open'?<>
      <path d="M25 85 9 52Q6 44 12 41Q19 38 25 50L29 57V24Q29 16 35 16Q41 16 41 24V48 16Q41 8 47 8Q53 8 53 16V47 22Q53 14 59 14Q65 14 65 22V50 34Q65 26 71 26Q77 26 77 34V63Q77 78 64 87Z"/>
      <path className="hand-crease" d="M34 68Q48 59 65 67M36 80H59"/>
    </>:<>
      <path d="M25 85 12 61Q7 52 13 48Q19 44 28 57V15Q28 6 35 6Q42 6 42 15V44Q44 37 50 38Q55 38 56 45Q59 40 64 42Q69 43 69 51Q80 47 80 59Q80 73 64 87Z"/>
      <path className="hand-crease" d="M35 64Q49 55 62 64M34 79H57M43 46V54M56 47V56"/>
    </>}
  </svg>;
}
