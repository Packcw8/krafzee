function ProjectCard({ project }) {
  const progress = Number(project.progress_percent ?? 0)

  return (
    <article className="project-card">
      {project.image_url ? (
        <img src={project.image_url} alt="" className="card-image" />
      ) : (
        <span className="listing-image">Project board</span>
      )}
      <div>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
      </div>
      <div className="project-progress" aria-label={`${progress}% complete`}>
        <span style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
      </div>
      <strong>{progress}% along</strong>
    </article>
  )
}

export default ProjectCard
