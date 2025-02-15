'use client';

const Background = () => {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-[#1a1a1a]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a2a2a_1px,transparent_1px),linear-gradient(to_bottom,#2a2a2a_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_1000px_at_50%_50%,transparent,#1a1a1a)]"></div>
      <div className="absolute inset-0">
        <div className="h-full w-full bg-[radial-gradient(circle_800px_at_50%_-100px,#2a2a2a,transparent)]"></div>
      </div>
    </div>
  );
};

export default Background;
