import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, Award, Users, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div style={{ backgroundColor: 'var(--color-cream)', minHeight: '100vh', paddingBottom: '6rem' }}>
      
      {/* Header */}
      <section style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border-subtle)', paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center' }}>
        <div className="container-narrow">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-berry)', fontWeight: 600 }}>
              OUR STORY & HERITAGE
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.6rem, 5vw, 4rem)', color: 'var(--color-plum)', marginBottom: '1.2rem', lineHeight: 1.1 }}>
            Crafting Cakes as Fine Art
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', lineHeight: 1.7, maxWidth: '640px', margin: '0 auto' }}>
            Cakexperiment was founded with a clear mission: to bring the refinement, precision, and romantic artistry of luxury Parisian cake design into every home kitchen.
          </p>
        </div>
      </section>

      {/* Narrative Section */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '6px solid #FFFFFF' }}>
                <img
                  src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80"
                  alt="Our Studio Workspace"
                  style={{ width: '100%', height: '440px', objectFit: 'cover' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-berry)', fontWeight: 600 }}>
                  THE ATELIER VISION
                </span>
                <span style={{ width: '30px', height: '1px', backgroundColor: 'var(--color-rose)' }} />
              </div>

              <h2 style={{ fontSize: '2.4rem', marginBottom: '1.2rem', color: 'var(--color-plum)' }}>
                Baking Beyond the Recipe Book
              </h2>

              <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: 1.7, marginBottom: '1.2rem' }}>
                Traditional cookbooks give you ingredient lists, but they fail to capture the tactile magic of baking: the exact sheen of whipped meringue, the gentle wrist pressure that yields a razor-sharp petal, or the temperature window where Belgian chocolate glazes achieve mirror perfection.
              </p>

              <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                At Cakexperiment, every single masterclass is filmed with high-definition macro cameras to capture every nuance. We balance the strict chemistry of European pastry technique with boundless creative experimentation.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div style={{ backgroundColor: '#FFFFFF', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-berry)', fontWeight: 600 }}>14,000+</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Students Guided</div>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-berry)', fontWeight: 600 }}>98.8%</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Five Star Reviews</div>
                </div>
              </div>

              <Link to="/courses" className="btn btn-primary">
                Explore Our Courses &rarr;
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: '5rem 0', backgroundColor: '#FFFFFF', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3.5rem auto' }}>
            <h2 style={{ fontSize: '2.4rem', color: 'var(--color-plum)', marginBottom: '0.8rem' }}>
              The Four Pillars of Cakexperiment
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
              How we approach culinary education differently from generic video platforms.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
            {[
              {
                title: 'Scientific Precision',
                desc: 'We explain the "why" behind every step so you can troubleshoot any kitchen issue with confidence.'
              },
              {
                title: 'Artisanal Aesthetics',
                desc: 'Our design palette celebrates romantic editorial botanicals, delicate textures, and modern luxury.'
              },
              {
                title: 'Accessible To All',
                desc: 'No intimidating barrier to entry. Every lesson is crafted with warm, patient, step-by-step guidance.'
              },
              {
                title: 'Lifelong Community',
                desc: 'Enjoy lifetime on-demand access to lesson videos, downloadable recipe sheets, and updates.'
              }
            ].map((val, idx) => (
              <div key={val.title} style={{ backgroundColor: 'var(--color-cream)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-blush)', color: 'var(--color-berry)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginBottom: '1rem' }}>
                  {idx + 1}
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.6rem' }}>{val.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
