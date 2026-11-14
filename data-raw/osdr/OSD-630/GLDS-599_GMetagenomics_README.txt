################################################################################
## This directory holds processed data for NASA OSD-630                       ##
## https://genelab-data.ndc.nasa.gov/genelab/accession/OSD-630/               ##
##                                                                            ##
## Processed by Olabiyi A. Obayomi (olabiyi.a.obayomi@nasa.gov)               ##
## Based on GL-DPPD-7107                                                      ##
################################################################################

Summary of contents:

    - README.txt                                                                - this file

    - FastQC_Outputs/                                                           - multiQC summary reports of FastQC runs

    - ../Raw_Sequence_Data/                                                     - initial read fastq files

    - Filtered_Sequence_Data/                                                   - quality-filtered fastq files

    - Assembly-based_Processing/                                                - results generated from assembly-based approach

        - Assembly-based-processing-overview_GLmetagenomics.tsv                 - Assembly-based overview per sample

        - assemblies/                                                           - per-sample assembly files and info
            - *-assembly.fasta                                                  - fasta files of individual sample assemblies
            - assembly-summaries_GLmetagenomics.tsv                             - table of all assemblies' summary statistics
            - Failed-assemblies_GLmetagenomics.tsv                              - samples that didn't assemble any contigs (if any)

        - predicted-genes/                                                      - per-sample predicted gene files
            - *.faa                                                             - gene amino-acid sequences
            - *.fasta                                                           - gene nucleotide sequences
            - *.gff                                                             - predicted genes in general feature format

        - annotations-and-taxonomy/                                             - per-sample Kegg Orthology (KO) annotations, taxonomy, and coverages
            - *-gene-coverage-annotation-tax.tsv                                - tables with gene coverage, annotation, and taxonomy info
            - *-contig-coverage-and-tax.tsv                                     - tables with contig coverage and taxonomy info

        - read-mapping/                                                         - per-sample bam, coverage, and mapping info files
            - *.bam                                                             - bam files
            - *.tsv                                                             - coverage files used for metabat2 binning
            - *.txt                                                             - stdout from bowtie2 mapping

        - bins/                                                                 - genomic bins recovered (if any)
            - *.fasta                                                           - fasta files of bins recovered
            - bins-overview_GLmetagenomics.tsv                                  - summary stats of bins recovered

        - MAGs/                                                                 - high-quality Metagenome-Assembled Genomes recovered (if any; > 90% est. comp., < 10% est. redundancy)
            - *.fasta                                                           - fasta files of MAGs
            - MAGs-overview_GLmetagenomics.tsv                                  - summary stats of MAGs including GTDB taxonomy
            - MAG-level-KO-annotations_GLmetagenomics.tsv                       - KO functional annotations associated with each MAG
            - MAG-KEGG-Decoder*                                                 - KEGG-Decoder summaries of MAG functional annotations

        - combined-outputs/                                                     - summary outputs with all samples combined
            - Combined-gene-level-KO-function-coverages_GLmetagenomics.tsv      - table of combined KO function coverages
            - Combined-gene-level-KO-function-coverages-CPM_GLmetagenomics.tsv  - table of combined KO function coverages, normalized to coverage per million
            - Combined-gene-level-taxonomy-coverages_GLmetagenomics.tsv         - table of combined, gene-level taxonomy coverages
            - Combined-gene-level-taxonomy-coverages-CPM_GLmetagenomics.tsv     - table of combined, gene-level taxonomy coverages, normalized to coverage per million
            - Combined-contig-level-taxonomy-coverages_GLmetagenomics.tsv       - table of combined, contig-level taxonomy coverages
            - Combined-contig-level-taxonomy-coverages-CPM_GLmetagenomics.tsv   - table of combined, contig-level taxonomy coverages, normalized to coverage per million

    - Read-based_Processing/                                                    - results generated from read-based approach
        - Gene-families_GLmetagenomics.tsv                                      - gene-family abundances
        - Gene-families-grouped-by-taxa_GLmetagenomics.tsv                      - gene-family abundances grouped by taxa
        - Gene-families-cpm_GLmetagenomics.tsv                                  - gene-family abundances normalized to copies-per-million
        - Gene-families-KO-cpm_GLmetagenomics.tsv                               - KO term abundances normalized to copies-per-million
        - Pathway-abundances_GLmetagenomics.tsv                                 - pathway abundances
        - Pathway-abundances-grouped-by-taxa_GLmetagenomics.tsv                 - pathway abundances grouped by taxa
        - Pathway-abundances-cpm_GLmetagenomics.tsv                             - pathway abundances normalized to copies-per-million
        - Pathway-coverages_GLmetagenomics.tsv                                  - pathway coverages
        - Pathway-coverages-grouped-by-taxa_GLmetagenomics.tsv                  - pathway coverages grouped by taxa
        - Metaphlan-taxonomy_GLmetagenomics.tsv                                 - metaphlan estimated taxonomic relative abundances

    - processing_info.zip                                                       - zip archive holding info related to processing
        - unique-sample-IDs.txt                                                 - single-column file of unique sample identifiers
        - Snakefile                                                             - Snakemake workflow file
        - config.yaml                                                           - configuration file for workflow
        - envs/                                                                 - conda environments for workflow
        - scripts/                                                              - scripts used by workflow
        - logs/                                                                 - log files of specific commands run

