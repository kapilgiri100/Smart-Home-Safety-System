export default function About() {
    return (
        <div className="rounded-2xl bg-white p-8 shadow-panel">
            <h1 className="mb-4 text-2xl font-semibold text-ink">About Us</h1>
            <p className="mb-4 text-sm text-muted">
                This smart home dashboard was built by a team of five Computer Engineering
                students from Mid-West University, 5th semester.
            </p>
            <div className="space-y-3 text-sm text-ink">
                <p>
                    <strong>Kapil Giri</strong>
                </p>
                <p>
                    <strong>Pramit Giri</strong>
                </p>
                <p>
                    <strong>Chandra Kamal Ghimire</strong>
                </p>
                <p>
                    <strong>Madan Bhushal</strong>
                </p>
                <p>
                    <strong>Purnima Badhual</strong>
                </p>
            </div>
            <p className="mt-6 text-sm text-muted">
                All team members are enrolled in the 5th semester of Computer Engineering at Mid-West University, surkhet.
            </p>
        </div>
    );
}
