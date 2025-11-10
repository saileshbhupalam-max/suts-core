# Frequently Asked Questions

Common questions about SUTS (Synthetic User Testing System).

## Table of Contents

1. [General Questions](#general-questions)
2. [Technical Questions](#technical-questions)
3. [Pricing and Licensing](#pricing-and-licensing)
4. [Comparison with Alternatives](#comparison-with-alternatives)
5. [Best Practices](#best-practices)
6. [Advanced Usage](#advanced-usage)

---

## General Questions

### What is SUTS?

SUTS (Synthetic User Testing System) is an open-source framework that simulates realistic user behaviors using Large Language Models (LLMs). It enables product teams to test and validate changes at scale before shipping to real users.

Unlike traditional user testing or rule-based simulation, SUTS uses LLMs to create personas that behave like real humans - complete with goals, biases, emotional responses, and realistic decision-making patterns.

### Why should I use SUTS?

**Use SUTS if you want to:**
- Test features before real users see them
- Predict user behavior and identify issues early
- Scale user research beyond manual testing limits
- Validate product decisions with data
- Reduce churn by fixing issues proactively
- Complement (not replace) traditional user research

**Don't use SUTS if:**
- You need 100% prediction accuracy (SUTS achieves 85% after calibration)
- You're testing visual design (SUTS focuses on behavior)
- You have zero budget for API costs (LLM calls cost money)
- You need real user feedback for qualitative insights

### How accurate is SUTS?

After calibration against real user data, SUTS achieves **85%+ prediction accuracy** for behavioral patterns. However:

- **Uncalibrated**: 60-70% accuracy (still useful for finding obvious issues)
- **Calibrated**: 85-90% accuracy (reliable for decision-making)
- **Edge cases**: Lower accuracy for rare scenarios

Accuracy improves with:
- Better stakeholder analysis
- More diverse personas
- Real user data for calibration
- Product-specific plugin tuning

### What does SUTS cost?

SUTS itself is **free and open-source** (MIT license), but you'll pay for:

1. **Anthropic API costs**: ~$0.10-0.50 per simulated user session
2. **Infrastructure**: Minimal (runs on laptop or cloud)
3. **Your time**: Initial setup and analysis

**Example costs:**
- 10 personas, 7 days: ~$35
- 100 personas, 14 days: ~$700
- 1000 personas, 30 days: ~$15,000

Cost scales with:
- Number of personas
- Simulation duration
- Time compression (faster = cheaper but less detailed)
- Model choice (Sonnet vs Opus)

### Is SUTS production-ready?

**Current status (v0.3.0)**: Beta
- ✅ Core functionality works
- ✅ High test coverage (95%+)
- ✅ TypeScript type safety
- ⚠️ API may change before v1.0
- ⚠️ Limited plugin ecosystem
- ⚠️ Performance optimizations ongoing

**v1.0 (planned Q1 2025)**: Production-ready
- Stable API
- Performance optimized
- Extended plugin ecosystem
- Production deployment guides

### Can SUTS replace real user testing?

**No.** SUTS complements, not replaces, real user research.

**Use SUTS for:**
- Scale: Test with 100s or 1000s of simulated users
- Speed: Get results in hours, not weeks
- Cost: Much cheaper than recruiting real users
- Pre-launch: Test before any users see it
- Iteration: Rapid testing of variations

**Use Real Users for:**
- Qualitative insights and emotions
- Visual design feedback
- Accessibility testing
- Brand perception
- Cultural nuances
- Final validation before launch

**Best approach**: Use SUTS early and often, validate with real users before launch.

---

## Technical Questions

### What LLM does SUTS use?

SUTS uses **Anthropic Claude** (Sonnet or Opus). Why Claude?

- **Instruction following**: Excellent at playing persona roles
- **Context window**: Large enough for full simulation context
- **Reasoning**: Strong causal reasoning for realistic decisions
- **Safety**: Good safety features for responsible AI use

**Models supported:**
- `claude-sonnet-4-20250514` (recommended, balanced cost/performance)
- `claude-opus-4-20250514` (higher quality, more expensive)

**Future support:**
- OpenAI GPT-4/GPT-5 (planned)
- Open-source models (planned)
- Custom fine-tuned models (v2.0)

### What languages does SUTS support?

**Code**: TypeScript/JavaScript only
- All packages written in TypeScript
- Full type safety and IDE support
- Runs on Node.js 18+

**Personas**: Any language supported by Claude
- English (best results)
- Spanish, French, German, etc. (good results)
- Non-Latin scripts (experimental)

**Documentation**: English only (currently)

### Can I use SUTS with Python?

Not directly, but options:

1. **Call from Python**: Use `subprocess` to call SUTS CLI
   ```python
   import subprocess
   subprocess.run(['npx', '@suts/cli', 'simulate', 'config.json'])
   ```

2. **API wrapper**: Build HTTP API around SUTS (community project)

3. **Python port**: Not planned currently (contributions welcome)

### How does SUTS handle sensitive data?

**Data privacy:**
- API calls go to Anthropic (see their [privacy policy](https://www.anthropic.com/privacy))
- No data sent to SUTS servers (doesn't exist)
- Local simulation data stored on your machine
- You control what data goes into personas

**Best practices:**
- Don't include PII in stakeholder analysis
- Don't use real user data in personas (anonymize first)
- Review API data before simulation
- Use self-hosted LLMs for sensitive products (v2.0 feature)

### Can I run SUTS offline?

**No** (currently), because it requires Anthropic API.

**Future options (v2.0+):**
- Self-hosted LLM support (Ollama, etc.)
- Prompt caching for reduced API calls
- Batch/async processing

### What are the system requirements?

**Minimum:**
- Node.js 18+
- 4 GB RAM
- 1 GB disk space
- Internet connection

**Recommended:**
- Node.js 20+
- 16 GB RAM
- 10 GB disk space
- Fast internet (for API calls)

**For large simulations (1000+ personas):**
- 32 GB+ RAM
- Multi-core CPU
- SSD storage

---

## Pricing and Licensing

### Is SUTS really free?

**Yes**, SUTS is **open-source** under MIT license:
- ✅ Free to use
- ✅ Free to modify
- ✅ Free for commercial use
- ✅ No attribution required (but appreciated)

You only pay for:
- Anthropic API usage
- Optional cloud infrastructure

### Can I use SUTS commercially?

**Yes**, MIT license allows commercial use.

**You can:**
- Use SUTS in commercial products
- Build paid services using SUTS
- Modify and sell SUTS-based tools
- Keep modifications private

**We appreciate (but don't require):**
- Attribution in docs
- Contributing improvements back
- Sharing case studies

### Do I need to share my plugins?

**No**, you can keep plugins private.

**We encourage (but don't require):**
- Open-sourcing generic plugins
- Contributing to plugin ecosystem
- Sharing learnings

### What's the catch?

**No catch.** SUTS is genuinely open-source.

**Why free?**
- Advance research in synthetic users
- Build community-driven tool
- Learn from diverse use cases
- Give back to open-source community

---

## Comparison with Alternatives

### SUTS vs Traditional User Testing

| Aspect | SUTS | Traditional |
|--------|------|-------------|
| Speed | Hours | Weeks |
| Cost | $100s | $1,000s-$10,000s |
| Scale | 100s-1000s users | 5-50 users |
| Setup | Automated | Manual recruiting |
| Insights | Quantitative + patterns | Qualitative + emotions |
| Timing | Pre-launch | Usually post-launch |
| Iteration | Fast (hours) | Slow (days/weeks) |

**Best for**: Scale, speed, pre-launch validation

### SUTS vs A/B Testing

| Aspect | SUTS | A/B Testing |
|--------|------|-------------|
| Timing | Pre-launch | Post-launch |
| Risk | Low (simulated) | High (real users) |
| Speed | Hours | Days/weeks |
| Results | Predictions | Ground truth |
| Sample size | Flexible | Requires sufficient traffic |

**Best for**: Pre-launch prediction, low-traffic features

### SUTS vs Rule-Based Simulation

| Aspect | SUTS | Rule-Based |
|--------|------|------------|
| Realism | High (LLM-based) | Low-medium |
| Flexibility | Adapts to any product | Requires manual rules |
| Complexity | Handles nuance | Struggles with edge cases |
| Setup time | Quick | Lengthy |
| Maintenance | Minimal | High |
| Cost | API costs | Development time |

**Best for**: Complex user behavior, rapid iteration

### SUTS vs Analytics

| Aspect | SUTS | Analytics |
|--------|------|-----------|
| Timing | Pre-launch | Post-launch |
| Data source | Simulated | Real users |
| Insights | Predictive | Descriptive |
| Coverage | All scenarios | Only observed |
| Cost | API costs | Free-$$ |

**Best for**: Pre-launch validation, scenario testing

---

## Best Practices

### How many personas should I generate?

**Depends on your goal:**

- **Exploration** (finding obvious issues): 10-30 personas
- **Validation** (reliable insights): 50-100 personas
- **Statistical confidence**: 200+ personas
- **Production simulation**: 500-1000+ personas

**Rule of thumb**: Start with 30, increase if needed.

### How long should simulations run?

**Typical durations:**
- **Onboarding test**: 1-3 sessions (first-time experience)
- **Feature test**: 7 sessions (1 week)
- **Retention test**: 14-30 sessions (2-4 weeks)
- **Long-term behavior**: 90+ sessions (3 months)

**Rule of thumb**: 7-14 sessions covers most scenarios.

### How do I improve accuracy?

1. **Better stakeholder analysis**: Detailed, realistic user descriptions
2. **Diverse personas**: High diversity weight (0.8-0.9)
3. **Calibration**: Compare with real user data and adjust
4. **Product-specific plugins**: Custom adapters for your product
5. **Iterative refinement**: Run multiple simulations, improve each time

### Should I use time compression?

**Yes**, for faster iteration:

- **Development** (exploring): 5x-10x compression
- **Validation** (reliable): 1x-2x compression
- **Production** (high quality): 0.5x-1x compression

**Trade-off**: Faster = less detailed, but usually good enough.

### How do I interpret results?

**Focus on:**
1. **Friction points**: Where users struggle
2. **Value moments**: Where users get delight
3. **Churn risk**: Who might leave
4. **Patterns**: Common behaviors across personas

**Ignore:**
- Single outliers (unless critical)
- Low-confidence predictions
- Non-actionable insights

**Act on:**
- High-severity friction affecting many personas
- Missing value moments (opportunity for improvement)
- High churn risk (fix before launch)

---

## Advanced Usage

### Can I integrate SUTS with my CI/CD?

**Yes!** See [CLI Reference](./CLI_REFERENCE.md) for examples.

**Typical flow:**
1. PR submitted with feature change
2. CI runs SUTS simulation
3. Analyze results automatically
4. Fail CI if critical friction detected
5. Comment insights on PR

### Can I customize persona generation?

**Yes**, multiple ways:

1. **Custom analysis docs**: Write detailed stakeholder analysis
2. **Diversity tuning**: Adjust diversity weight (0-1)
3. **Filtering**: Select subset of personas
4. **Manual editing**: Edit generated personas JSON
5. **Real data**: Use real user data for calibration (v2.0)

### Can I export results to other tools?

**Yes**, SUTS outputs standard formats:

- **JSON**: Full data, easy to parse
- **CSV**: For Excel, BI tools
- **HTML**: Human-readable reports
- **Custom**: Write your own exporter

**Integrations (planned):**
- Mixpanel
- Amplitude
- Segment
- Custom webhooks

### How do I scale to 1000+ personas?

**Optimization strategies:**

1. **Parallel execution**: Use multiple workers
2. **Time compression**: 10x compression
3. **Batch processing**: Process in chunks
4. **Cloud scaling**: Run on AWS/GCP
5. **Caching**: Aggressive prompt caching

See [Configuration Guide](./CONFIGURATION.md) for details.

### Can I use SUTS for mobile apps?

**Yes**, but with caveats:

- Focus on **user behavior**, not UI interactions
- Define mobile-specific scenarios (touch, gestures)
- Account for mobile context (on-the-go, interruptions)
- Build mobile-specific plugin

**Better support** in v2.0 with multi-modal simulation.

---

## Still Have Questions?

- **Documentation**: [docs/README.md](./README.md)
- **GitHub Discussions**: [Ask the community](https://github.com/your-org/suts-core/discussions)
- **Issues**: [Report bugs](https://github.com/your-org/suts-core/issues)
- **Email**: support@suts.dev (security issues only)

---

**Last Updated**: 2024-11-10
**Version**: 0.3.0
