import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const Arrow = () => <span aria-hidden="true">↗</span>

const projects = [
  {
    number: '01',
    title: 'Mori Studio',
    type: 'Brand identity · Web design',
    className: 'mori',
    visual: <><div className="mori-mark">MORI<span>®</span></div><div className="mori-shape shape-one" /><div className="mori-shape shape-two" /></>
  },
  {
    number: '02',
    title: 'Daily Rituals',
    type: 'E-commerce · Art direction',
    className: 'rituals',
    visual: <><div className="bottle bottle-large"><i /></div><div className="bottle bottle-small"><i /></div><div className="ritual-copy">DAILY<br/>RITUALS</div></>
  },
  {
    number: '03',
    title: 'Field Notes',
    type: 'Editorial · Digital experience',
    className: 'notes',
    visual: <><div className="notes-title">field<br/>notes.</div><div className="sun" /><div className="hill hill-back" /><div className="hill hill-front" /></>
  }
]

function App() {
  return <main>
    <nav className="nav wrap" aria-label="Main navigation">
      <a className="logo" href="#top">MC<span>.</span></a>
      <div className="nav-links"><a href="#work">Work</a><a href="#about">About</a><a href="#contact">Contact</a></div>
      <a className="availability" href="mailto:hello@mayachen.design"><b /> Available for work</a>
    </nav>

    <section id="top" className="hero wrap">
      <p className="eyebrow">Independent product designer · 2024</p>
      <h1>Thoughtful design<br/><em>for a changing world.</em></h1>
      <div className="hero-bottom">
        <p>I create digital experiences and identities<br/>that feel as good as they function.</p>
        <a className="circle-link" href="#work" aria-label="See selected work">↓</a>
      </div>
    </section>

    <section id="work" className="work wrap">
      <div className="section-heading"><p className="eyebrow">Selected work</p><span>(03)</span></div>
      <div className="project-grid">
        {projects.map((project) => <article className="project" key={project.number}>
          <div className={`project-visual ${project.className}`}>{project.visual}</div>
          <div className="project-meta"><span>{project.number}</span><div><h2>{project.title}</h2><p>{project.type}</p></div><a href="#contact" aria-label={`View ${project.title}`}><Arrow /></a></div>
        </article>)}
      </div>
    </section>

    <section id="about" className="about wrap">
      <p className="eyebrow">A little about me</p>
      <div className="about-content"><h2>I believe good design<br/>creates <em>space to breathe.</em></h2><div><p>I’m Maya, an independent designer based in Melbourne. I partner with people and teams who care deeply about the things they make.</p><a className="text-link" href="mailto:hello@mayachen.design">More about me <Arrow /></a></div></div>
    </section>

    <footer id="contact" className="footer">
      <div className="wrap"><p className="eyebrow">Have a project in mind?</p><a className="footer-title" href="mailto:hello@mayachen.design">Let’s make it <em>matter.</em><span>↗</span></a><div className="footer-bottom"><span>© 2024 Maya Chen</span><div><a href="#top">LinkedIn</a><a href="#top">Instagram</a><a href="mailto:hello@mayachen.design">Email</a></div></div></div>
    </footer>
  </main>
}

createRoot(document.getElementById('root')).render(<App />)
