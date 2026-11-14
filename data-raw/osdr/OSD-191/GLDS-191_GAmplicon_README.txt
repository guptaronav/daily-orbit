##################################################################################
## This directory holds processed data for NASA GLDS-191                        ##
## https://genelab-data.ndc.nasa.gov/genelab/accession/GLDS-191/                ##
##                                                                              ##
## Processed by Michael D. Lee (Mike.Lee@nasa.gov)                              ##
## Based on GL-DPPD-7104-A for Illumina amplicon data                           ##
## Annotated code is in "processing_info.tar"                                   ##
##################################################################################

Summary of contents:


    - README.txt                        - this file

    - FastQC_Outputs/                   - multiQC summary reports of FastQC runs

    - Trimmed_Sequence_Data/            - primer-trimmed sequenced fastq files and info
        - *.fastq.gz                    - trimmed reads
        - *cutadapt.log                 - log file of stdout/stderr from cutadapt
        - *trimmed-read-counts.tsv      - counts of raw and trimmed reads

    - Filtered_Sequence_Data/           - quality-filtered sequence fastq files
        - *.fastq.gz                    - quality-filtered reads

    - Final_Outputs/                    - primary output files
        - *.fasta                       - fasta file of recovered sequences
        - *-counts.tsv                  - count table of sequenes across samples
        - *-taxonomy.tsv                - taxonomy of recovered sequences
        - *.biom                        - biom-formatted output of taxonomy and counts
        - *-read-count-tracking.tsv     - read counts at each processing step
        - *-taxonomy-and-counts.tsv     - taxonomy and counts table

    - processing_info.tar               - a compressed directory holding info related to processing
        - primers.fa                    - primer sequences
        - sample-info.tsv               - sample information useful during processing
        - *-unique-sample-IDs.txt       - single-column file of unique sample identifiers
        - full-command-line-log.sh      - all command-line processing code used
        - full-R-processing.R           - all R processing code used

